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
  },
  getFromId: async transactionId => {
    const transaction = await pool.query(
      "SELECT id FROM transaction WHERE id = $1",
      [transactionId]
    );
    if (transaction.rowCount !== 1)
      throw "Transaction id must be unique and valid";
    else return transaction.rows[0];
  },
  /** Deletes transaction after unsuccess in that transaction processing */
  deleteTransaction: async transactionId => {
    await pool.query("DELETE FROM transaction WHERE id = $1", [transactionId]);
  }
};

module.exports = transactionQueries;
