const pool = require("../db");

const paymentQueries = {
  // checks if a payment intent has already been used
  alreadyUsed: async id => {
    const results = await pool.query("SELECT * FROM used_pi WHERE pi_id = $1", [
      id
    ]);
    return results.rowCount !== 0;
  }
};

module.exports = paymentQueries;
