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
  /** Insert multiple services */
  insertMultipleServices: async (shopId, services) => {
    const values = services
      .map(
        service =>
          `(${shopId}, '${service.name}', '${service.image}', '${service.type}')`
      )
      .join(", ");

    const servicesQuery = await pool.query(
      `INSERT INTO service VALUES ${values} RETURNING *`
    );
    return servicesQuery.rows;
  },
  /** Insert multiple goals */
  insertMultipleGoals: async (shopId, goals) => {
    const values = goals
      .map(goal => `(${shopId}, '${goal.name}', ${goal.amount})`)
      .join(", ");

    const servicesQuery = await pool.query(
      `INSERT INTO goal VALUES ${values} RETURNING *`
    );
    return servicesQuery.rows;
  },
  /** Inserts goal */
  insertGoal: async (shop, name, amount) => {
    await pool.query("INSERT INTO goal VALUES ($1, $2, $3)", [
      shop,
      name,
      amount
    ]);
    return true;
  },
  /** Get services from id */
  servicesFromId: async id => {
    const services = await pool.query("SELECT * FROM service WHERE shop = $1", [
      id
    ]);
    return services.rows;
  },
  /** Get goals from id */
  goalsFromId: async id => {
    const services = await pool.query("SELECT * FROM goal WHERE shop = $1", [
      id
    ]);
    return services.rows;
  }
};

module.exports = shopInfos;
