const pool = require("../db");

const validateLoginId = id => {
  const username = id.slice(1);
  const table = null;
  switch (id.slice(0, 1)) {
    case "@":
      table = user;
      break;
    case "#":
      table = shop;
      break;
    default:
      return null;
  }
  const query = await pool.query(`SELECT * FROM ${table} WHERE username = $1`, [username]);
  //   if (id.startsWith("@")) {
  //     // user
  //     const query = await pool.query("SELECT * FROM user WHERE user.username = $1", [username])
  //   } else if (id.startsWith("#")) {
  //     // shop
  //   }
  //   return false;
};

console.log(validateLoginId("#alfa"));
