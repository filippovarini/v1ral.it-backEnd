const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../db/db");

const router = express.Router();

const checkAdmin = require("../middlewares/CheckAdmin");

// db queries
const adminQueries = require("../db/queries/admin");
const productQueries = require("../db/queries/products");

/** Get home dashboard data
 * - total challengers
 * - viral challengers
 * - total shpos
 * - challenger orders [{date, price}]
 * - shop orders [{date, price}]
 */
router.get("/home", checkAdmin, async (req, res) => {
  try {
    const superAdmin = Boolean(req.superAdmin);
    if (req.superAdmin) req.superAdmin = null;
    const challengersStats = await adminQueries.getChallengerStats();
    const shopsStats = await adminQueries.getShopStats();
    const challengerOrders = await adminQueries.getUserOrders();
    const shopOrders = await adminQueries.getShopOrders();
    const products = await productQueries.getList();
    const admins = await adminQueries.getAdminList();
    const maintenanceStatus = await adminQueries.getMaintenanceStatus();
    res.json({
      success: true,
      superAdmin,
      userStats: {
        totalChallengers: parseInt(challengersStats.total_users),
        viralChallengers: parseInt(challengersStats.virals),
        shops: parseInt(shopsStats)
      },
      shopOrders,
      challengerOrders,
      products,
      admins,
      maintenanceStatus
    });
  } catch (e) {
    console.log(e);
    res.json({
      success: false,
      serverError: true,
      message: "Errore nel recupero delle informazioni sulla dashbaord"
    });
  }
});

/** Checks if there is a admin user already logged */
router.get("/logged", checkAdmin, (_, res) => {
  res.json({ logged: true });
});

router.post("/register", async (req, res) => {
  try {
    const { username, psw } = req.body;
    const users = await pool.query("SELECT * FROM admin WHERE username = $1", [
      username
    ]);
    if (users.rowCount > 0)
      res.json({ success: false, usernameDuplicate: true });
    else {
      const hashed = await bcrypt.hash(psw, 10);
      const user = await pool.query(
        "INSERT INTO admin VALUES ($1, $2, 'basic') RETURNING username",
        [username, hashed]
      );
      req.session.admin = user.rows[0].username;
      res.json({ success: true });
    }
  } catch (e) {
    console.log(e);
    res.json({
      serverError: true,
      message: "Errore nella registrazione dell'admin"
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    let success = false;
    const { username, psw } = req.body;
    const users = await pool.query("SELECT * FROM admin WHERE username = $1", [
      username
    ]);
    if (users.rowCount !== 0) {
      const pswMatch = await bcrypt.compare(psw, users.rows[0].psw);
      if (pswMatch) {
        success = true;
        req.session.admin = users.rows[0].username;
      }
    }
    res.json({ success });
  } catch (e) {
    console.log(e);
    res.json({
      success: false,
      serverError: true,
      message: "Errore nel login dell'admin"
    });
  }
});

/** Posts new product in the database
 * @param product
 */
router.post("/product", checkAdmin, async (req, res) => {
  try {
    await productQueries.insert(req.body.product);
    res.json({ success: true });
  } catch {
    res.json({
      success: false,
      serverError: true,
      message: "Errore nell'inserimento di un nuovo prodotto"
    });
  }
});

/** Update maintenance status
 * @param value value of maintenance (on/off)
 */
router.put("/maintenance", checkAdmin, async (req, res) => {
  try {
    await adminQueries.setMaintenance(req.body.value);
    res.json({ success: true });
  } catch {
    res.json({
      success: false,
      serverError: true,
      message: "Errore nell'eliminazione di un prodotto"
    });
  }
});

/** Deletes product from the database
 * @param id
 */
router.delete("/product", checkAdmin, async (req, res) => {
  try {
    await productQueries.deleteFromId(req.body.id);
    res.json({ success: true });
  } catch {
    res.json({
      success: false,
      serverError: true,
      message: "Errore nell'eliminazione di un prodotto"
    });
  }
});

/** Deletes admin user from database
 * @param admin (username)
 */
router.delete("/admins", checkAdmin, async (req, res) => {
  try {
    await adminQueries.removeAdmin(req.body.admin);
    res.json({ success: true });
  } catch {
    res.json({
      success: false,
      serverError: true,
      message: "Errore nell'eliminazione dell'utente admin"
    });
  }
});

module.exports = router;
