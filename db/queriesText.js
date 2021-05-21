const pool = require("./db");
const insertBlankShops = require("../functions/insertBlankShops");

const queriesText = {
  /** Get shop list and additional info
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
        shop.logo,
        shop.background,
        shop.province,
        shop.city,
        shop.connected_id,
        shop.initial_price,
        shop.current_price,
        COALESCE(COUNT(*), 0) AS premiums,
        LEAST(COALESCE(CAST(COUNT(CASE WHEN "user" = $1 THEN "user" END) AS INT), 0), 1) AS already_bought
      FROM shop LEFT JOIN premium
        ON shop.id = premium.shop
      ${filters || " "}
      GROUP BY (shop.id)`,
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
        shop.logo,
        shop.background,
        shop.email,
        shop.clicks,
        shop.province,
        shop.stock_month_duration,
        shop.stocks_number,
        shop.city,
        shop.street,
        shop.postcode,
        shop.bio,
        shop.current_price,
        shop.current_price,
        shop.connected_id,
        shop.phone,
        shop.insta_link,
        shop.fb_link,
        shop.website,
        COALESCE(SUM(premium.price), 0) AS financed_so_far,
        COALESCE(CAST(COUNT(*) AS INT), 0) AS premiums
    FROM shop LEFT JOIN premium
        ON shop.id = premium.shop
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
        shop.logo,
        shop.background,
        shop.province,
        shop.city,
        shop.stock_month_duration,
        shop.current_price,
        shop.current_price,
        premiums.price_payed,
        premiums.last_renewal 
      FROM
        shop 
        JOIN
            (SELECT
                  shop,
                  "user",
                  premium.price AS price_payed,
                  COALESCE(MAX(renewal.renewal_date), premium.transaction_date) AS last_renewal 
              FROM premium NATURAL LEFT JOIN renewal 
              GROUP BY shop, "user", premium.transaction_date)
            AS premiums 
        ON shop.id = premiums.shop 
      WHERE
        premiums.user = $1 
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
