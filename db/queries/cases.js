const pool = require("../db");

const casesQueries = {
  daily: async () => {
    const now = new Date();
    const date = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    const cases = await pool.query(
      "SELECT id FROM transaction WHERE date >= $1 AND type = 'challenger'",
      [date]
    );
    return cases.rowCount;
  },
  total: async () => {
    const cases = await pool.query(
      "SELECT CAST(COUNT(id) AS INT) AS number, DATE(date) AS date FROM transaction WHERE type = 'challenger' GROUP BY DATE(date) ORDER BY DATE"
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
      "SELECT CAST(COUNT(DISTINCT shop.id) AS INT) AS number\
            FROM premium JOIN shop\
               ON premium.shop = shop.id "
    );
    return financedShops.rows[0].number;
  },
  dailyFinancedShops: async () => {
    const now = new Date();
    const date = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    const cases = await pool.query(
      "SELECT id FROM transaction WHERE date >= $1 AND type = 'challenger'",
      [date]
    );
    return cases.rowCount;
  }
};

module.exports = casesQueries;
