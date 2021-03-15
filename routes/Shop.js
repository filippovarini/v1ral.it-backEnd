const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../db/db");

const router = express.Router();

// middlewares
const checkChallenger = require("../middlewares/CheckChallenger");

// db queries
const shopQueries = require("../db/queries/shops");

/** Register shop */
router.post("/register", async (req, res) => {
  const {
    name,
    category,
    maxPremiums,
    initialPrice,
    currentPrice,
    clicks,
    bio,
    email,
    city,
    province,
    street,
    postcode,
    connectedId,
    backgroundurl,
    logourl,
    psw
  } = req.body;
  try {
    const hashed = await bcrypt.hash(psw, 10);
    const newShopUser = await shopQueries.register([
      name,
      category,
      maxPremiums,
      initialPrice,
      currentPrice,
      clicks,
      bio,
      email,
      city,
      province,
      street,
      postcode,
      connectedId,
      backgroundurl,
      logourl,
      hashed
    ]);
    req.session.loginId = `#${newShopUser}`;
    res.json({ success: true, shopUser: newShopUser });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Errore nella registrazione del negozio" });
  }
});

/**
 * logs user in:
 * 1. check username exists
 * 2. compare passwords
 * 3. saves username in session
 */
router.post("/login", async (req, res) => {
  let success = false;
  try {
    const { email, psw } = req.body;
    const query = await pool.query(
      "SELECT id, psw FROM shop WHERE email = $1",
      [email]
    );
    if (query.rowCount !== 0) {
      if (query.rowCount > 1) throw "Username or email must be unique";
      else {
        const pswMatch = await bcrypt.compare(psw, query.rows[0].psw);
        if (pswMatch) {
          success = true;
          req.session.loginId = `#${query.rows[0].id}`;
          res.json({ success: true, shopUser: query.rows[0].id });
        }
      }
    }
    if (!success)
      res.json({
        success: false,
        message: "Nessun utente con queste credenziali"
      });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Errore nel completamento del login" });
  }
});

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
 * Select shop to be premium in, by updating cart.
 * Checks that: has a challenger OR has a account already
 * body: shopId
 */
router.put("/updateCart", checkChallenger, (req, res) => {
  // Already validated
  cart = req.session.cart || [];
  cart.push(req.body.shopId);
  req.session.cart = cart;
  res.json({ success: true });
});

module.exports = router;
