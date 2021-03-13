const express = require("express");

const router = express.Router();

/**
 * Update shopSI:
 * {[si to be updated]: text - null (deactivated)}
 *
 */
router.put("/updateSI", (req, res) => {
  req.session.shopSI
    ? Object.keys(req.body.shopSI).forEach(
        key => (req.session.shopSI[key] = req.body.shopSI[key])
      )
    : (req.session.shopSI = req.body.shopSI);

  res.json({ success: true });
});

/**
 * Clear search session
 */
router.delete("/clearSearch", (req, res) => {
  req.session.shopSI = null;
  res.json({ success: true });
});

module.exports = router;
