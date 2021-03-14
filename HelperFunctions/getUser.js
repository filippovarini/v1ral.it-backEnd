const pool = require("../db/db");

/**
 * Get user, by executing different queries on whether it is a shop or a user
 */
const getUser = async id => {
  let parsedId = id.slice(1);
  let queryString = null;
  switch (id.slice(0, 1)) {
    case "@":
      queryString = "SELECT * FROM user WHERE username = $1";
      break;
    case "#":
      queryString = "SELECT * FROM shop WHERE shop.id = $1";
      parsedId = parseInt(parsedId);
      break;
    default:
      return null;
  }

  const query = await pool.query(queryString, [parsedId]);
  switch (query.rowCount) {
    case 1:
      return query.rows[0];
    case 0:
      return null;
    default:
      throw "Username must be unique";
  }
};

module.exports = getUser;
