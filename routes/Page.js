const express = require("express");

const router = express.Router();

// middlewares
const checkShopSI = require("../middlewares/CheckShopSI");

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

/* SEARCH SHOP RESULT */
router.get("/searchResult", checkShopSI, async (req, res) => {
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

module.exports = router;
