const pool = require("../db");

const shopsQueries = {
  getList: async () => {
    const shops = await pool.query(listQuery);
    return shops.rows;
  },

  /**
   * Get shops by name inserted. Using patterns to get flexible search
   */
  getFromSearch: async (name, city, category) => {
    const namePatterns = name
      .toLowerCase()
      .split(" ")
      .filter(str => str !== "") // make it work even with multiple spaces
      .map((str, i) => (i == 0 ? `%${str}%` : ` ${str}%`))
      .join("");
    const nameFilter = " WHERE LOWER(name) LIKE $1";
    const cityFilter = city ? ` AND LOWER(city) LIKE '%${city}%'` : "";
    const categoryFilter = category
      ? ` AND LOWER(category) LIKE '%${category}%'`
      : "";

    const shops = await pool.query(
      listQuery + nameFilter + cityFilter + categoryFilter,
      [namePatterns]
    );
    return shops.rows;
  }
};

/** DB STRING QUERIES */
const listQuery = `
SELECT
  shop.name,
  shop.category,
  shop.maxpremiums,
  shop.currentprice,
  shop.city,
  shop.logourl,
  COALESCE(goalsDone.perc, 0) AS goalsDone,
  COALESCE(goalsDone.premiums, 0) AS premiums
FROM
  shop LEFT JOIN 
  (SELECT goals.shop, 
          SUM(premium.price) / CAST(goals.total AS FLOAT) AS perc, 
          COUNT(*) AS premiums
   FROM premium NATURAL JOIN 
        (SELECT shop, SUM(amount) AS total
         FROM goal
         GROUP BY shop
        ) AS goals
  GROUP BY goals.shop, goals.total) AS goalsDone
ON shop.id = goalsDone.shop`;

module.exports = shopsQueries;
