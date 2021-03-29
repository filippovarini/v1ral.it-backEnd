const pool = require("../db");

const formatDatePrice = require("../../functions/formatDatePrice");

const adminQueries = {
  getChallengerStats: async () => {
    const stats = await pool.query(
      ` SELECT 
            COUNT(*) AS total_users, 
            COUNT(CASE WHEN type='viral' THEN username END) AS virals 
        FROM "user"`
    );
    return stats.rows[0];
  },
  getShopStats: async () => {
    const shops = await pool.query(`
    SELECT COUNT(*) AS total_shops FROM shop`);
    return shops.rows[0].total_shops;
  },
  getUserOrders: async () => {
    const userOrders = await pool.query(
      `SELECT transaction_date AS date, price FROM premium`
    );
    return formatDatePrice(userOrders.rows);
  },
  getShopOrders: async () => {
    const shopOrders = await pool.query(
      "SELECT date, product.price FROM shop_transaction JOIN product ON shop_transaction.product = product.id"
    );
    return formatDatePrice(shopOrders.rows);
  },
  getAdminList: async () => {
    const admins = await pool.query("SELECT username, type FROM admin");
    return admins.rows;
  },
  removeAdmin: async username => {
    await pool.query("DELETE FROM admin WHERE username = $1", [username]);
    return true;
  },
  getMaintenanceStatus: async () => {
    const maintenanceStatus = await pool.query(
      "SELECT value FROM website_setting WHERE type = 'maintenance'"
    );
    return maintenanceStatus.rows[0].value;
  },
  setMaintenance: async value => {
    await pool.query(
      "UPDATE website_setting SET value = $1 WHERE type = 'maintenance'",
      [value]
    );
    return true;
  }
};

module.exports = adminQueries;
