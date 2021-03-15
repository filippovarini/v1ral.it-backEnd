const pool = require("../db");

const transactionQueries = {
  /** Posts new challenger transaction */
  postChallengerTrans: async (amount, buyerId) => {
    const newTrans = await pool.query(
      `INSERT INTO transaction(amount, type, buyerId, date)
           VALUES($1, 'challenger', $2, $3)`,
      [amount, buyerId, new Date()]
    );
    return true;
  }
};

module.exports = transactionQueries;
