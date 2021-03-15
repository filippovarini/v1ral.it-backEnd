const express = require("express");

const router = express.Router();

// middlewares
const checkShopSI = require("../middlewares/CheckShopSI");
const checkCart = require("../middlewares/CheckCart");
const checkTransactionId = require("../middlewares/CheckTransactionId");

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
    res.json({ rtIndex, totalCases, dailyCases, financedShops });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Errore nella richiesta di dati" });
  }
});

router.get("/home/shops", async (req, res) => {
  try {
    const shopList = await shops.getList();
    res.json({ shopList });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Errore nella richiesta di dati" });
  }
});

router.get("/home/users", async (req, res) => {
  try {
    const userList = await users.getList();
    res.json({ userList });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Errore nella richiesta di dati" });
  }
});

/** Shop search results */
router.get("/shops", checkShopSI, async (req, res) => {
  const { name, city, category } = req.session.shopSI;
  try {
    const shopList = await shops.getFromSearch(name, city, category);
    res.json({ success: true, shops: shopList });
  } catch (e) {
    console.log(e);
    res
      .status(500)
      .json({ message: "Errore nella ricerca delle imprese nel database" });
  }
});

/**
 * On Front-End, get /shopProfile/:id.
 * Send request to /page/shopProfile/:id
 */
router.get("/shopProfile/:id", async (req, res) => {
  try {
    const shop = await shops.getFromId(req.params.id);
    res.json({ success: true, shop });
  } catch (e) {
    console.log(e);
    res
      .status(500)
      .json({ message: "Errore nel connetersi alle informazioni del negozio" });
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

module.exports = router;
