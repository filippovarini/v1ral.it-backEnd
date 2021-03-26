const pool = require("../db");

const transactionQueries = {
  /** Finds the user transaction from the transaction id which is the timestamp
   * of the date object stored in the "premium" collection
   */
  getUserTransaction: async transaction_id => {
    console.log(transaction_id);
    const transaction_date = new Date(parseInt(transaction_id));
    console.log(transaction_date);
    const transaction = await pool.query(
      "SELECT * FROM premium WHERE transaction_date = $1",
      [transaction_date]
    );
    if (transaction.rowCount < 1) throw "Transaction id is not valid.";
    else return transaction.rows[0];
  },

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
