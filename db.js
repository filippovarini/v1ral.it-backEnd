const Pool = require("pg").Pool;
const keys = require("./keys/dev").psqlKeys;

const pool = new Pool(keys);

module.exports = pool;
