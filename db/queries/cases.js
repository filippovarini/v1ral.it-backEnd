const formatDates = require("../../HelperFunctions/formatDates");
const pool = require("../db");

const totalCasesFromTransactions =
  "SELECT * FROM transaction WHERE type = 'challenger'";
const totalCasesFromPremiums =
  "SELECT date FROM premium JOIN transaction ON premium.transactionid = transaction.id";

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
      // "SELECT CAST(COUNT(id) AS INT) AS number, DATE(date) AS date FROM transaction WHERE type = 'challenger' GROUP BY DATE(date) ORDER BY DATE"
      totalCasesFromPremiums
    );
    return formatDates(cases.rows);
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
      FROM premium JOIN transaction
      ON premium.transactionId = transaction.id
      WHERE transaction.date >= $1`,
      [date]
    );
    return cases.rowCount;
  }
};

module.exports = casesQueries;
