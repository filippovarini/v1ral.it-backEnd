const queriesText = require("../../queriesText");
const pool = require("../../db");

const formatPassExpiration = require("../../../functions/formatPassExpiration");
const camelCase = require("../../../functions/camelCaseKeys");

/** Shop search queries */
const shopSearch = {
  /** Get list of shops with all the relevant info */
  getList: async userId => {
    const shops = await queriesText.shopList([userId]);
    return shops.rows;
  },
  getCities: async () => {
    const cities = await pool.query("SELECT DISTINCT city FROM shop");
    return cities.rows.map(row => row.city);
  },
  getCategories: async () => {
    const category = await pool.query("SELECT DISTINCT category FROM shop");
    return category.rows.map(row => row.category);
  },
  /** Returns the info of all shops purchased by a specific user and checks if
   * the logged user has bought them as well
   */
  getPurchasedByUser: async (username, loggedUsername) => {
    let shops = null;
    if (loggedUsername === username) {
      // dashboard
      query = await queriesText.passes(username);
      shops = formatPassExpiration(query);
    } else {
      const filter = `
      WHERE shop.id = ANY (SELECT shop 
        FROM premium 
        WHERE premium."user" = '${username}') `;
      const query = await queriesText.shopList([loggedUsername], filter);
      shops = query.rows;
    }
    return shops;
  },
  /**
   * Get shops by search parameters. Using patterns to get flexible search.
   * Filter by name, city and category. Can also filter only by one.
   * @param userId to get already purchased
   */
  getFromSearch: async (userId, shopSI) => {
    const filter = `
      WHERE LOWER(shop.name) LIKE $2
      AND LOWER(shop.city) LIKE $3
      AND LOWER(category) LIKE $4
      `;
    const namePatterns = shopSI.name
      ? name
          .toLowerCase()
          .split(" ")
          .filter(str => str !== "") // make it work even with multiple spaces
          .map((str, i) => (i == 0 ? `%${str}%` : ` ${str}%`))
          .join("")
      : "%";
    const cityFilter = shopSI.city ? shopSI.city.toLowerCase() : "%";
    const categoryFilter = shopSI.category
      ? shopSI.category.toLowerCase()
      : "%";

    const shops = await queriesText.shopList(
      [userId, namePatterns, cityFilter, categoryFilter],
      filter
    );
    return shops.rows.map(shop => camelCase(shop));
  },
  /** Gets shop list info from ids */
  getFromIds: async ids => {
    const filter = "WHERE shop.id = ANY ($2)";
    const shops = await queriesText.shopList([null, ids], filter);
    if (shops.rowCount !== ids.length) throw "Ids must be all unique and valid";
    return shops.rows;
  },
  /** Gets price and connected id from id */
  getPriceFromIds: async ids => {
    const shops = await pool.query(
      "SELECT id, current_price, connected_id FROM shop WHERE id = ANY ($1)",
      [ids]
    );
    if (shops.rowCount !== ids.length)
      throw "Invalid shop id in cart. Valid shops are " +
        shops.rowCount +
        " but expected in cart " +
        ids.length;
    return shops.rows;
  }
};

module.exports = shopSearch;
