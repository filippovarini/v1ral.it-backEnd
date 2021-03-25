const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../db/db");

const router = express.Router();

// middlewares
const checkChallenger = require("../middlewares/CheckChallenger");
const checkAuth = require("../middlewares/CheckAuth");
const checkUpdatable = require("../middlewares/CheckUpdatable");

// db queries
const shopQueries = require("../db/queries/shops");
const servicesAndGoals = require("../db/queries/servicesAndGoals");

/** Register shop
 * @param shop object with all new user shop info
 * @param goals goals to insert
 * @param services services to insert
 */
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
  } = req.body.shop;
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
    await servicesAndGoals.insertMultipleServices(
      newShopUser.id,
      req.body.services
    );
    await servicesAndGoals.insertMultipleGoals(newShopUser.id, req.body.goals);
    req.session.loginId = `#${newShopUser.id}`;
    res.json({
      success: true,
      id: newShopUser.id,
      name: newShopUser.name,
      userProfile: newShopUser.logourl
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      serverError: true,
      message: "Errore nella registrazione del negozio"
    });
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
    res.status(500).json({
      success: false,
      serverError: true,
      message: "Errore nel completamento del login"
    });
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
    res
      .status(500)
      .json({ success: false, serverError: true, message: "Errore interno" });
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

/** Removes from cart
 * @param shopId Id of the shop to be removed from cart
 */
router.put("/removeFromCart", (req, res) => {
  if (!req.session.cart)
    res.json({
      success: false,
      cartEmpty: true,
      message: "Nessun carrello salvato nella sessione"
    });
  else {
    req.session.cart = req.session.cart.filter(
      shopId => shopId != req.body.shopId
    );
    res.json({ success: true });
  }
});

/** Updates user info
 * Doesn't checkAuth as to click button you need to have checked it
 * @todo use a safer middleware to handle requests not from browser
 * @param update object with values to edit
 */
router.put("/updateInfo", checkAuth, checkUpdatable, async (req, res) => {
  try {
    if (req.session.loginId[0] !== "#")
      throw `LoginId prefix should be # but is ${req.session.loginId[0]}`;
    else {
      // await user
      const shop = await shopQueries.update(
        req.session.loginId.slice(1),
        req.body.update
      );
      res.json({ success: true, shop });
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      serverError: true,
      message: "Errore nel salvataggio delle modifiche. Prova a riprovare"
    });
  }
});

/**
 * @param oldPsw
 * @param newPsw
 */
router.put("/updatePsw", checkAuth, async (req, res) => {
  try {
    if (req.session.loginId[0] !== "#")
      throw `LoginId prefix should be # but is ${req.session.loginId[0]}`;
    else {
      const { oldPsw, newPsw } = req.body;
      const dbPsw = await shopQueries.getOldPsw(req.session.loginId.slice(1));
      const pswMatch = await bcrypt.compare(oldPsw, dbPsw);
      if (pswMatch) {
        const hashed = await bcrypt.hash(newPsw, 10);
        const shop = await shopQueries.update(req.session.loginId.slice(1), {
          psw: hashed
        });
        res.json({
          success: true,
          message: "Password aggiornata correttamente",
          shop
        });
      } else {
        res.json({
          success: false,
          pswInvalid: true,
          message: "Vecchia password non corretta"
        });
      }
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      serverError: true,
      message:
        "Errore nel salvataggio delle modifiche. Ti consigliamo di riprovare"
    });
  }
});

module.exports = router;
