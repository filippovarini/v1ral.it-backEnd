const pool = require("../db");

const premiumQueries = {
  /**
   * Insert multiple rows after checkout
   * @param shops contains {id, price}
   */
  insertFromIds: async (userId, shops) => {
    let values = "";
    shops.forEach(
      (shop, i) =>
        (values +=
          (i == 0 ? "" : ", ") + `(${shop.id}, '${userId}', ${shop.price})`)
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
  }
};
module.exports = premiumQueries;
