const pool = require("./db");
const insertBlankShops = require("../functions/insertBlankShops");

const queriesText = {
  /**
   * - get shop list
   * - get if added by user
   * @param queryParams username logged
   * @param filters filters string
   */
  shopList: async (queryParams, filters) => {
    const query = await pool.query(
      `
      SELECT 
        shop.id,
        shop.name,
        shop.category, 
        shop.logourl,
        shop.backgroundurl,
        shop.province,
        shop.city,
        shop.currentprice,
        shop.initialprice,
        COALESCE(SUM(info.amount), 0) AS disruption_index,
        COALESCE(SUM(info.price), 0) AS financed_so_far,
        COALESCE(COUNT(DISTINCT info."user"), 0) AS premiums,
        CASE WHEN COALESCE(CAST(COUNT(CASE WHEN info."user" = $1 THEN info."user" END) AS INT), 0) = 0 THEN 0 ELSE 1 END AS alreadyBought
      FROM shop LEFT JOIN (goal NATURAL JOIN premium) AS info
        ON shop.id = info.shop
      ${filters || " "}  
      GROUP BY shop.id`,
      queryParams
    );
    return query;
  },
  /** Get shop profile info */
  shopProfile: async shopId => {
    const query = await pool.query(
      `
    SELECT 
        shop.id,
        shop.name,
        shop.category, 
        shop.logourl,
        shop.backgroundurl,
        shop.email,
        shop.clicks,
        shop.province,
        shop.pass_month_duration,
        shop.maxpremiums,
        shop.city,
        shop.street,
        shop.postcode,
        shop.bio,
        shop.currentprice,
        shop.initialprice,
        shop.connectedid,
        COALESCE(SUM(info.price), 0) AS financed_so_far,
        COALESCE(CAST(COUNT(info."user") AS INT), 0) AS total_premiums,
        COALESCE(CAST(COUNT(CASE WHEN info.type = 'viral' THEN info."user" END) AS INT), 0) AS viral_premiums
    FROM shop LEFT JOIN (premium JOIN "user" ON premium."user" = "user".username) AS info
        ON shop.id = info.shop
    WHERE shop.id = $1
    GROUP BY shop.id`,
      [shopId]
    );
    return query;
  },
  /** Get passes purchased by a user and also returns the original price at
   * which the user payed it and the date.
   * - get if added by user
   * @param username logged user username
   */
  passes: async username => {
    // query shop and single premium (the pass the user bought)
    const query1 = await pool.query(
      `
      SELECT 
        shop.id,
        shop.name,
        shop.category, 
        shop.logourl,
        shop.backgroundurl,
        shop.province,
        shop.city,
        shop.pass_month_duration,
        shop.currentprice,
        shop.initialprice,
        premium.price AS price_payed,
        premium.transaction_date
      FROM premium JOIN shop
        ON shop.id = premium.shop
      WHERE premium.user = $1
      ORDER BY shop.id DESC`,
      [username]
    );

    // Query goals and total premiums
    const query2 = await pool.query(
      `
      SELECT 
        premium.shop,
        COALESCE(SUM(premium.price), 0) AS financed_so_far,
        COALESCE(CAST(COUNT(premium."user") AS INT), 0) AS premiums,
        COALESCE(SUM(goal.amount), 0) AS disruption_index
      FROM premium NATURAL JOIN goal
      GROUP BY premium.shop
      ORDER BY premium.shop
      `
    );

    const query2Formatted = insertBlankShops(query1.rows[0].id, query2.rows);

    const shops = query1.rows;

    return shops.map(shop => {
      return {
        ...shop,
        financed_so_far: query2Formatted[shop.id].financed_so_far || 0,
        premiums: query2Formatted[shop.id].premiums || 0,
        disruption_index: query2Formatted[shop.id].disruption_index || 0,
        alreadybought: 1
      };
    });
  }
};

module.exports = queriesText;
