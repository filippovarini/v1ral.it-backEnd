const express = require("express");

const router = express.Router();

/**
 * Update shopSI:
 * {[si to be updated]: text - null (deactivated)}
 * Either ONLY title or (city, category).
 * If only title, reset all search params.
 *
 */
router.put("/updateSI", (req, res) => {
  try {
    if (req.body.shopSI.name) {
      // should be the only one
      if (Object.keys(req.body.shopSI).length > 1) throw "Title must be alone";
      else req.session.shopSI = req.body.shopSI;
    } else {
      // city or category\
      if (!req.session.shopSI)
        throw "Session must have a title associated to be filtered";
      else
        Object.keys(req.body.shopSI).forEach(
          key => (req.session.shopSI[key] = req.body.shopSI[key])
        );
    }
    res.json({ success: true, a: req.session.shopSI });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Errore interno" });
  }
});

/**
 * Select shop to be premium in, by updating CART
 */
router.put("/updateCart");

module.exports = router;
