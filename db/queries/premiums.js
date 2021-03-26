const pool = require("../db");

const premiumQueries = {
  /**
   * Insert multiple rows after checkout
   * @param shops contains {id, price}
   * @param transaction_date date of successful transaction
   */
  insertFromIds: async (userId, shops, transaction_date) => {
    let values = "";
    shops.forEach(
      (shop, i) =>
        (values +=
          (i == 0 ? "" : ", ") + `(${shop.id}, '${userId}', ${shop.price}, $1)`)
    );
    const premiumsQuery = await pool.query(
      `INSERT INTO premium VALUES ${values} RETURNING *`,
      [transaction_date]
    );
    return premiumsQuery.rows;
  },
  /**
   * Deletes all premiums from a transaction date
   * @param transaction_date
   */
  deleteFromTransactionDate: async transaction_date => {
    await pool.query(
      `DELETE FROM premium
       WHERE transaction_date = $1`,
      [transaction_date]
    );
  },
  /** Checks the shops the user is getting premium in have not already been
   * purchased by the same user, hence violating the uniqueness of primary key
   * */
  alreadyBought: async (userId, shopIds) => {
    const alreadyPremium = await pool.query(
      `
    SELECT * 
    FROM premium 
    WHERE "user" = $1
    AND shop = ANY ($2)`,
      [userId, shopIds]
    );
    return alreadyPremium.rowCount !== 0;
  }
};

module.exports = premiumQueries;
