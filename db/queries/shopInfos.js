const pool = require("../db");

const shopInfos = {
  /** Inserts Service */
  insertService: async (shop, name, image) => {
    await pool.query("INSERT INTO service VALUES ($1, $2, $3)", [
      shop,
      name,
      image
    ]);
    return true;
  },
  /** Inserts goal */
  insertGoal: async (shop, name, amount) => {
    await pool.query("INSERT INTO goal VALUES ($1, $2, $3)", [
      shop,
      name,
      amount
    ]);
    return true;
  }
};

module.exports = shopInfos;
