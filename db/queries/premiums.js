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
      `INSERT INTO premium VALUES ${values}`
    );
    return true;
  }
};

module.exports = premiumQueries;
