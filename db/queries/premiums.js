const pool = require("../db");

const premiumQueries = {
  /**
   * Insert multiple rows after checkout
   * @param shops contains {id, price}
   */
  insertFromIds: async (userId, transactionId, shops) => {
    let values = "";
    shops.forEach(
      (shop, i) =>
        (values +=
          (i == 0 ? "" : ", ") +
          `(${shop.id}, '${userId}', ${shop.price}, ${transactionId})`)
    );
    const premiumsQuery = await pool.query(
      `INSERT INTO premium VALUES ${values} RETURNING *`
    );
    return premiumsQuery.rows;
  },
  /**
   * Deletes all premiums
   */
  deletePremiums: async premiums => {
    const shops = [];
    premiums.forEach(premium => {
      shops.push(premium.shop);
    });
    await pool.query(
      `DELETE FROM premium
       WHERE shop = ANY ($1)
        AND "user" = $2`,
      [shops, premiums[0].user]
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
