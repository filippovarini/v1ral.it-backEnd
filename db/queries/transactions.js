const pool = require("../db");
const formatProducts = require("../../functions/formatProducts");

const transactionQueries = {
  /** Finds the user transaction from the transaction id which is the timestamp
   * of the date object stored in the "premium" collection
   */
  getUserTransaction: async transaction_id => {
    const transaction_date = new Date(parseInt(transaction_id));
    const transaction = await pool.query(
      "SELECT * FROM premium WHERE transaction_date = $1",
      [transaction_date]
    );
    if (transaction.rowCount < 1) throw "Transaction id is not valid.";
    else return transaction.rows[0];
  },
  /** Finds the shop transaction from the transaction id which is the timestamp
   * of the date object stored in the "premium" collection
   */
  getShopTransaction: async transaction_id => {
    const transaction_date = new Date(parseInt(transaction_id));
    const transaction = await pool.query(
      "SELECT * FROM shop_transaction WHERE date = $1",
      [transaction_date]
    );
    if (transaction.rowCount < 1) throw "Transaction id is not valid.";
    else return transaction.rows[0];
  },
  /** Get total spent by a shop */
  getShopTransactionTotal: async shopId => {
    const total = await pool.query(
      "SELECT COALESCE(SUM(price_then), 0) AS total FROM shop_transaction WHERE shop = $1",
      [shopId]
    );
    return total.rows[0].total;
  },
  /** Gets marketing products bought by a shop
   * @return [products]
   */
  getShopProducts: async shopId => {
    const products = await pool.query(
      `
    SELECT *
    FROM shop_transaction JOIN product 
      ON shop_transaction.product = product.id
      JOIN product_image
    ON product.id = product_image.product
    WHERE shop_transaction.shop = $1`,
      [shopId]
    );
    const formattedProducts = formatProducts(products.rows);
    return formattedProducts;
  },
  /** Checks that all passes in the user cart have not been sold out */
  checkShopPassesAvailability: async ids => {
    const passesLeft = await pool.query(
      `
    SELECT (shop.maxpremiums - COUNT(*)) AS passeseleft 
    FROM shop JOIN premium 
      ON shop.id = premium.shop 
    WHERE id = ANY ($1)
    GROUP BY shop.id`,
      [ids]
    );
    return !passesLeft.rows.some(row => row.passeseleft < 0);
  },
  /**
   * Insert multiple rows after checkout
   * @param products contains [id]
   * @param date date of successful transaction
   * @param shopId
   */
  insertFromIds: async (shopId, date, products) => {
    const values = products
      .map(
        product => `($1, ${parseInt(shopId)}, ${product.id}, ${product.price})`
      )
      .join(", ");

    const premiumsQuery = await pool.query(
      `INSERT INTO shop_transaction VALUES ${values} RETURNING *`,
      [date]
    );
    return premiumsQuery.rows;
  },
  /** Inserts the renewal from checkout session */
  insertRenewals: async (userId, renewals, transactionDate) => {
    if (renewals.length === 0) return true;
    else {
      const values = renewals
        .map(shop => `(${shop.id}, '${userId}', $1)`)
        .join(", ");

      await pool.query(`INSERT INTO renewal VALUES ${values}`, [
        transactionDate
      ]);
      return true;
    }
  },
  deleteFromTransactionId: async transactionId => {
    await pool.query("DELETE FROM shop_transaction WHERE date = $1", [
      new Date(transactionId)
    ]);
    return true;
  }
};

module.exports = transactionQueries;
