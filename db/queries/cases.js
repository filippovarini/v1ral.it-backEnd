const formatDates = require("../../functions/formatDateNumber");
const pool = require("../db");

const casesQueries = {
  daily: async () => {
    const now = new Date();
    const date = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    const cases = await pool.query(
      "SELECT * FROM premium WHERE transaction_date >= $1",
      [date]
    );
    return cases.rowCount;
  },
  total: async () => {
    const cases = await pool.query(
      "SELECT transaction_date AS date FROM premium"
    );
    return formatDates(cases.rows);
  },
  financedShops: async () => {
    const financedShops = await pool.query(
      "SELECT CAST(COUNT(DISTINCT shop) AS INT) AS number FROM premium"
    );
    return financedShops.rows[0].number;
  },
  dailyFinancedShops: async () => {
    const now = new Date();
    const date = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    const cases = await pool.query(
      `
      SELECT * 
      FROM premium 
      WHERE transaction_date >= $1`,
      [date]
    );
    return cases.rowCount;
  }
};

module.exports = casesQueries;
