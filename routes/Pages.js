const express = require("express");

const router = express.Router();

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
    const shopList = await shops.list();
    res.json({ shopList });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Errore nella richiesta di dati" });
  }
});

router.get("/home/users", async (req, res) => {
  try {
    const userList = await users.list();
    res.json({ userList });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Errore nella richiesta di dati" });
  }
});

module.exports = router;
