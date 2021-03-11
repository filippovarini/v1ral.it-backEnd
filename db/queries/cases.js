const pool = require("../db");

const casesQueries = {
  daily: async () => {
    const now = new Date();
    const date = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    const cases = await pool.query(
      "SELECT id FROM transaction WHERE date >= $1 AND type = 'premium'",
      [date]
    );
    return cases.rowCount;
  },
  total: async () => {
    const cases = await pool.query(
      "SELECT COUNT(id) AS number, DATE(date) AS date FROM transaction WHERE type = 'premium' GROUP BY DATE(date)"
    );
    return cases.rows;
  },
  avgRt: async () => {
    const avgRt = await pool.query(
      'SELECT CAST(COUNT(*) AS FLOAT) / CAST(COUNT(DISTINCT challenger) AS FLOAT) AS avg\
              FROM "user"'
    );
    return avgRt.rows[0].avg.toFixed(1);
  },
  financedShops: async () => {
    const financedShops = await pool.query(
      "SELECT COUNT(DISTINCT shop.id) AS number\
            FROM premium JOIN shop\
               ON premium.shop = shop.id "
    );
    return financedShops.rows[0].number;
  }
};

module.exports = casesQueries;
