const pool = require("./db");

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
  }
};

module.exports = queriesText;
