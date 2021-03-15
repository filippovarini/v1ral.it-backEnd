const pool = require("../db");

const transactionQueries = {
  /** Posts new challenger transaction */
  postChallengerTrans: async (amount, buyerId) => {
    const newTrans = await pool.query(
      `INSERT INTO transaction(amount, type, buyerId, date)
           VALUES($1, 'challenger', $2, $3) RETURNING id`,
      [amount, buyerId, new Date()]
    );
    return newTrans.rows[0].id;
  }
};

module.exports = transactionQueries;
