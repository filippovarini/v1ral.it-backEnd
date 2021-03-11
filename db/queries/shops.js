const pool = require("../db");

const shopsQueries = {
  list: async () => {
    const shops = await pool.query(
      "SELECT name, category, maxpremiums, currentprice, city, logourl FROM shop"
    );
    return shops.rows;
  }
};

module.exports = shopsQueries;
