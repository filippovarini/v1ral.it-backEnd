const express = require("express");

const router = express.Router();

// queries
const shops = require("../db/queries/shops");

router.get("/name/:searchId/:city/:category", async (req, res) => {
  try {
    const shopList = await shops.getByName(req.params.searchId);
    res.json({ success: true, shops: shopList });
  } catch (e) {
    console.log(e);
    res
      .status(500)
      .json({ message: "Errore nella ricerca delle imprese nel database" });
  }
});

module.exports = router;
