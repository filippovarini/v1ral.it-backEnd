const express = require("express");

const router = express.Router();

// middlewares
const checkCart = require("../middlewares/CheckCart");
const checkTransactionId = require("../middlewares/CheckTransactionId");
const checkAuth = require("../middlewares/CheckAuth");

// queries
const cases = require("../db/queries/cases");
const shops = require("../db/queries/shops");
const users = require("../db/queries/users");

/* HOME */

router.get("/home/quickFacts", async (req, res) => {
  try {
    const rtIndex = await cases.avgRt();
    const totalCases = await cases.total();
    const dailyCases = await cases.daily();
    const financedShops = await cases.financedShops();
    res.json({
      success: true,
      info: { rtIndex, totalCases, dailyCases, financedShops }
    });
  } catch (e) {
    console.log(e);
    res
      .status(500)
      .json({ success: false, message: "Errore nella richiesta di dati" });
  }
});

router.get("/home/shops", async (req, res) => {
  try {
    const shopList = await shops.getList();
    res.json({ success: true, shopList });
  } catch (e) {
    console.log(e);
    res
      .status(500)
      .json({ success: false, message: "Errore nella richiesta di dati" });
  }
});

router.get("/home/users", async (req, res) => {
  try {
    const userList = await users.getList();
    res.json({ success: true, userList });
  } catch (e) {
    console.log(e);
    res
      .status(500)
      .json({ success: false, message: "Errore nella richiesta di dati" });
  }
});

/** Shop search results */
/** Accessible even without any search identifier */
router.get("/shops", async (req, res) => {
  try {
    if (req.session.shopSI) {
      const { name, city, category } = req.session.shopSI;
      shopList = await shops.getFromSearch(name, city, category);
    } else shopList = await shops.getList();
    res.json({ success: true, shops: shopList });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Errore nella ricerca delle imprese nel database"
    });
  }
});

/**
 * On Front-End, get /shopProfile/:id.
 * Send request to /page/shopProfile/:id
 * - updates view count of shop
 */
router.get("/shopProfile/:id", async (req, res) => {
  try {
    console.log("sending first");
    const shop = await shops.getFromId(req.params.id);
    console.log("done first");
    await shops.viewed(req.params.id);
    res.json({ success: true, shop });
  } catch (e) {
    console.log(e);
    res
      .status(500)
      .json({
        success: false,
        message: "Errore nel connetersi alle informazioni del negozio"
      });
  }
});

/* Checkout info */
router.get("/checkout", checkCart, (req, res) => {
  const shops = req.shops;
  req.shops = null; // free up req of unnecessary data
  res.json({ success: true, shops });
});

/** Checkout confirmation
 * - validates transaction id
 * - sends back authentication
 */
router.get("/success/:transactionId", checkTransactionId, async (req, res) => {
  res.json({ success: true, transactionId: req.params.transactionId });
});

/** User search results
 * get username from query params.
 */
router.get("/users/:username", async (req, res) => {
  try {
    const userList = await users.getByName(req.params.username);
    res.json({ success: true, users: userList });
  } catch (e) {
    console.log(e);
    res
      .status(500)
      .json({ message: "Errore nel recupero delle informazioni sugli utenti" });
  }
});

/** Send back single user info
 * get  username from query params
 */
router.get("/user/:username", async (req, res) => {
  try {
    const user = await users.getUnique(req.params.username);
    res.json({ success: true, user: user });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      message: "Errore nel recupero delle informazioni sul profilo dell'utente"
    });
  }
});

/* DASHBOARDS */

/** USED FOR DASHBOARD AND SETTINGS
 * Checks if there is a valid loginId
 * Fetches user info
 */
router.get("/dashboard/user", checkAuth, async (req, res) => {
  try {
    if (req.session.loginId[0] !== "@")
      throw `LoginId prefix should be @ but is ${req.session.loginId[0]}`;
    else {
      const user = await users.getUnique(req.session.loginId.slice(1));
      res.json({ success: true, user: user[0] });
    }
  } catch (e) {
    console.log(e);
    res
      .status(500)
      .json({ success: false, message: "Username non valido o non unico" });
  }
});

/** USED FOR DASHBOARD AND SETTINGS
 * Checks if there is a valid loginId
 * Fetches shop info
 */
router.get("/dashboard/shop", checkAuth, async (req, res) => {
  try {
    if (req.session.loginId[0] !== "#")
      throw `LoginId prefix should be # but is ${req.session.loginId[0]}`;
    else {
      const shop = await shops.getFromId(req.session.loginId.slice(1));
      res.json({ success: true, shop });
    }
  } catch (e) {
    console.log(e);
    res
      .status(500)
      .json({ success: false, message: "Shop ID non valido o non unico" });
  }
});

module.exports = router;
