const Pool = require("pg").Pool;
const keys = require("./keys/dev").psql;

const pool = new Pool(keys);

module.exports = pool;
