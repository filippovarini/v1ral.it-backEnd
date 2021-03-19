const express = require("express");

const router = express.Router();

// middlewares
const checkCart = require("../middlewares/CheckCart");
const checkTransactionId = require("../middlewares/CheckTransactionId");
const checkAuth = require("../middlewares/CheckAuth");
const checkNotAuth = require("../middlewares/CheckNotAuth");

// queries
const cases = require("../db/queries/cases");
const shops = require("../db/queries/shops");
const users = require("../db/queries/users");

/** Gets name and profile for header */
router.get("/header", checkAuth, async (req, res) => {
  try {
    switch (req.session.loginId[0]) {
      case "@": {
        const user = await users.getUnique(req.session.loginId.slice(1));
        res.json({
          success: true,
          name: "@" + user[0].username,
          userProfile: user[0].profileurl
        });
        break;
      }
      case "#": {
        const shop = await shops.getShortInfoFromId(
          req.session.loginId.slice(1)
        );
        res.json({
          success: true,
          name: "#" + shop[0].name,
          userProfile: shop[0].logourl
        });
        break;
      }
      default:
        throw "Username prefix is invalid. Got " + req.session.loginId[0];
    }
  } catch (e) {
    console.log(e);
    res.json({
      serverError: true,
      success: false,
      message: "Errore nel recuperare le informazioni dell'utente registrato"
    });
  }
});

/* HOME */
router.get("/home/quickFacts", async (req, res) => {
  try {
    const rtIndex = await cases.avgRt();
    const totalCases = await cases.total();
    const dailyCases = await cases.daily();
    const financedShops = await cases.financedShops();
    const dailyFinancedShops = await cases.dailyFinancedShops();
    res.json({
      success: true,
      info: {
        rtIndex,
        totalCases,
        dailyCases,
        financedShops,
        dailyFinancedShops
      }
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      serverError: true,
      message: "Errore nella richiesta di dati"
    });
  }
});

router.get("/home/shops", async (req, res) => {
  try {
    const shopList = await shops.getList();
    res.json({ success: true, shopList });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      serverError: true,
      message: "Errore nella richiesta di dati"
    });
  }
});

router.get("/home/users", async (req, res) => {
  try {
    const userList = await users.getList();
    res.json({ success: true, userList });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      serverError: true,
      message: "Errore nella richiesta di dati"
    });
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
      serverError: true,
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
    const shop = await shops.getFromId(req.params.id);
    await shops.viewed(req.params.id);
    res.json({
      success: true,
      shop,
      added: req.session.cart && req.session.cart.includes(shop.id)
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      serverError: true,
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
    res.status(500).json({
      success: false,
      serverError: true,
      message: "Errore nel recupero delle informazioni sugli utenti"
    });
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
      success: false,
      serverError: true,
      message: "Errore nel recupero delle informazioni sul profilo dell'utente"
    });
  }
});

/* LOG IN - REGISTER */
router.get("/login", checkNotAuth, (req, res) => {
  res.json({ success: true });
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
    res.status(500).json({
      success: false,
      serverError: true,
      message: "Username non valido o non unico"
    });
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
    res.status(500).json({
      success: false,
      serverError: true,
      message: "Shop ID non valido o non unico"
    });
  }
});

module.exports = router;
