const formatDates = require("../../functions/formatDates");
const pool = require("../db");

/** Query to get list
 * Missing group by at the end, so that it can also be used in filter queries
 */
const rawListQuery = `
SELECT 
  shop.id,
  shop.name,
  shop.category, 
  shop.logourl,
  shop.backgroundurl,
  shop.province,
  shop.city,
  shop.currentprice,
  COALESCE(SUM(info.amount), 0) AS disruption_index,
  COALESCE(SUM(info.price), 0) AS financed_so_far,
  COALESCE(COUNT(DISTINCT info."user"), 0) AS premiums
FROM shop LEFT JOIN (goal NATURAL JOIN premium) AS info
  ON shop.id = info.shop`;

/** Gets list plus a numeric value showing that the user has already bought that
 * shop:
 * 0: no
 * 1 yes*/
const rawListQueryAdded = `
SELECT 
  shop.id,
  shop.name,
  shop.category, 
  shop.logourl,
  shop.backgroundurl,
  shop.province,
  shop.city,
  shop.currentprice,
  COALESCE(SUM(info.amount), 0) AS disruption_index,
  COALESCE(SUM(info.price), 0) AS financed_so_far,
  COALESCE(COUNT(DISTINCT info."user"), 0) AS premiums,
  CASE WHEN COALESCE(CAST(COUNT(CASE WHEN info."user" = $1 THEN info."user" END) AS INT), 0) = 0 THEN 0 ELSE 1 END AS alreadyBought
FROM shop LEFT JOIN (goal NATURAL JOIN premium) AS info
  ON shop.id = info.shop`;

const detaliedInfoQuery = `
SELECT 
  shop.id,
  shop.name,
  shop.category, 
  shop.logourl,
  shop.backgroundurl,
  shop.province,
  shop.maxpremiums,
  shop.city,
  shop.bio,
  shop.currentprice,
  shop.initialprice,
  COALESCE(SUM(info.price), 0) AS financed_so_far,
  COALESCE(CAST(COUNT(info."user") AS INT), 0) AS total_premiums,
  COALESCE(CAST(COUNT(CASE WHEN info.type = 'viral' THEN info."user" END) AS INT), 0) AS viral_premiums
FROM shop LEFT JOIN (premium JOIN "user" ON premium."user" = "user".username) AS info
  ON shop.id = info.shop
WHERE shop.id = $1
GROUP BY shop.id`;

const dashboardQuery = `
SELECT 
  shop.id,
  shop.name,
  shop.category, 
  shop.logourl,
  shop.email,
  shop.clicks,
  shop.backgroundurl,
  shop.province,
  shop.maxpremiums,
  shop.city,
  shop.street,
  shop.postcode,
  shop.bio,
  shop.currentprice,
  shop.initialprice,
  COALESCE(SUM(info.price), 0) AS financed_so_far,
  COALESCE(CAST(COUNT(info."user") AS INT), 0) AS total_premiums,
  COALESCE(CAST(COUNT(CASE WHEN info.type = 'viral' THEN info."user" END) AS INT), 0) AS viral_premiums
FROM shop LEFT JOIN (premium JOIN "user" ON premium."user" = "user".username) AS info
  ON shop.id = info.shop
WHERE shop.id = $1
GROUP BY shop.id`;

/**
 * Shop Queries
 * !! AT the moment NOT OPTIMIZED
 * @todo Optimize queries
 */
const shopsQueries = {
  getList: async shopId => {
    const shops = await pool.query(rawListQueryAdded + " GROUP BY shop.id", [
      shopId
    ]);
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
  /** Returns the info of all shops purchased by a specific user */
  getPurchasedByUser: async username => {
    const shops = await pool.query(
      rawListQuery +
        ` WHERE shop.id = ANY (SELECT shop 
                              FROM premium 
                              WHERE premium."user" = $1) 
          GROUP BY shop.id`,
      [username]
    );
    return shops.rows;
  },
  /**
   * Get shops by name inserted. Using patterns to get flexible search. Filter
   * by name and city and category
   */
  getFromSearch: async (name, city, category, userId) => {
    const namePatterns = name
      .toLowerCase()
      .split(" ")
      .filter(str => str !== "") // make it work even with multiple spaces
      .map((str, i) => (i == 0 ? `%${str}%` : ` ${str}%`))
      .join("");
    const nameFilter = " WHERE LOWER(shop.name) LIKE $2";
    const cityFilter = city
      ? ` AND LOWER(shop.city) LIKE '%${city.toLowerCase()}%'`
      : "";
    const categoryFilter = category ? ` AND category LIKE '%${category}%'` : "";
    const shops = await pool.query(
      rawListQueryAdded +
        nameFilter +
        cityFilter +
        categoryFilter +
        " GROUP BY shop.id",
      [userId, namePatterns]
    );
    return shops.rows;
  },
  /** Retreives name and logourl for header profile */
  getProfile: async id => {
    const shop = await pool.query(
      "SELECT name, logourl, id FROM shop WHERE id = $1",
      [id]
    );
    if (shop.rowCount !== 1) throw "Id must be unique and valid";
    else return shop.rows;
  },
  /** Returns long and detalied list of values */
  getProfileInfo: async id => {
    const shop = await pool.query(detaliedInfoQuery, [id]);
    if (shop.rowCount !== 1) throw "Id must be unique and valid";
    else return shop.rows[0];
  },
  getDashboardInfo: async id => {
    const shop = await pool.query(dashboardQuery, [id]);
    if (shop.rowCount !== 1) throw "Id must be unique and valid";
    else return shop.rows[0];
  },
  /** Returns the list of cases from a shop */
  getCases: async id => {
    const cases = await pool.query(
      "SELECT date FROM premium JOIN transaction ON premium.transactionid = transaction.id WHERE premium.shop = $1",
      [id]
    );
    return formatDates(cases.rows);
  },
  getOldPsw: async id => {
    const shops = await pool.query(
      "SELECT psw\
      FROM shop\
      WHERE id = $1",
      [id]
    );
    if (shops.rowCount !== 1)
      throw `Username is not unique nor valid. Instead of 1, got ${shops.rowCount} users`;
    else {
      return shops.rows[0].psw;
    }
  },
  /** Gets shop list info from ids */
  getFromIds: async ids => {
    const shops = await pool.query(
      rawListQuery + " WHERE shop.id = ANY ($1) GROUP BY shop.id",
      [ids]
    );
    if (shops.rowCount !== ids.length) throw "Ids must be all unique and valid";
    return shops.rows;
  },
  /** Gets maps price to id */
  getPriceFromIds: async ids => {
    const shops = await pool.query(
      "SELECT id, currentprice FROM shop WHERE id = ANY ($1)",
      [ids]
    );
    if (shops.rowCount !== ids.length)
      throw "Invalid shop id in cart. Valid shops are " +
        shops.rowCount +
        " but expected in cart " +
        ids.length;
    return shops.rows;
  },
  register: async info => {
    const query = await pool.query(
      `
      INSERT INTO shop(
        "name",
        category,
        maxPremiums,
        initialPrice,
        currentPrice,
        clicks,
        bio,
        email,
        city,
        province,
        street,
        postcode,
        connectedId ,
        backgroundURL,
        logoURL,
        psw)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING id, name, logourl`,
      info
    );
    return query.rows[0];
  },
  /** Increments view count by 1 */
  viewed: async id => {
    await pool.query("UPDATE shop SET clicks = clicks + 1 WHERE id = $1 ", [
      id
    ]);
    return true;
  },
  update: async (id, newInfo) => {
    let setters = "";
    Object.keys(newInfo).forEach(
      (key, i) => (setters += (i == 0 ? "" : ", ") + `${key} = \$${i + 1}`)
    );
    const updatedInfo = await pool.query(
      `
    UPDATE shop
    SET ${setters}
    WHERE id = ${id}
    RETURNING *`,
      Object.values(newInfo)
    );
    if (updatedInfo.rowCount !== 1) throw "Username is not unique or valid";
    else return updatedInfo.rows[0];
  }
};

module.exports = shopsQueries;
