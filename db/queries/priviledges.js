const pool = require("../db");
const camelCase = require("../../functions/camelCaseKeys");

const priviledgesQueries = {
  getFromId: async id => {
    const privs = await pool.query("SELECT * FROM priviledge WHERE shop = $1", [
      id
    ]);
    return privs.rows.map(priv => camelCase(priv));
  },
  /** Inserts priv */
  insertPriviledge: async (shop, title, description, type) => {
    await pool.query("INSERT INTO priviledge VALUES ($1, $2, $3, $4)", [
      shop,
      title,
      description,
      type
    ]);
    return true;
  },
  /** Insert multiple privs */
  insertMultiplePriviledges: async (shopId, privs) => {
    const values = privs
      .map(
        priv =>
          `(${shopId}, '${priv.title}', '${priv.description}', '${priv.type}')`
      )
      .join(", ");

    const privQuery = await pool.query(
      `INSERT INTO priviledge VALUES ${values} RETURNING *`
    );
    return privQuery.rows;
  },
  /** Get privs from id */
  privsFromId: async id => {
    const privs = await pool.query("SELECT * FROM priviledge WHERE shop = $1", [
      id
    ]);
    return privs.rows;
  }
};

module.exports = priviledgesQueries;
