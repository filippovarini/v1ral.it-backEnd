const pool = require("../db");

const shopsQueries = {
  getList: async () => {
    const shops = await pool.query(listQuery);
    return shops.rows;
  },

  /**
   * Get shops by name inserted. Using patterns to get flexible search
   */
  getByName: async name => {
    const patterns = name
      .toLowerCase()
      .split(" ")
      .filter(str => str !== "") // make it work even with multiple spaces
      .map((str, i) => (i == 0 ? `%${str}%` : ` ${str}%`))
      .join("");
    const shops = await pool.query(singleQuery, [patterns]);
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

const singleQuery = listQuery + " WHERE LOWER(name) LIKE $1";

module.exports = shopsQueries;
