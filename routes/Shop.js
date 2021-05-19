const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../db/db");

const router = express.Router();

// functions
const checkChargesEnabled = require("../functions/connectChargesEnabled");

// middlewares
const checkAuth = require("../middlewares/CheckAuth");
const checkUpdatable = require("../middlewares/CheckUpdatable");

// db queries
const shopQueries = require("../db/queries/shop/shops");
const priviledgesQueries = require("../db/queries/priviledges");
const servicesAndGoals = require("../db/queries/servicesAndGoals");

/**
 * Register shop from information in backend. The information is not complete
 * for the shop to be visible online, but at least for now it is online
 * @param stock
 * @param credentials
 * @param profile
 */
router.post("/register", async (req, res) => {
  try {
    console.log(req.body);
    const { profile, stock, credentials } = req.body;
    const { name, category, bio, logourl, backgroundurl } = profile;
    const {
      owner_name,
      owner_phone,
      email,
      psw,
      city,
      street,
      province,
      postcode
    } = credentials;
    const {
      priviledges,
      stockNumber,
      initialPrice,
      stockMonthDuration
    } = stock;

    const hashed = await bcrypt.hash(psw, 10);

    const registerQuery = await pool.query(
      `
    INSERT INTO shop (name, 
      category, 
      bio, 
      logo, 
      background, 
      owner_name, 
      owner_phone,
      email,
      psw,
      city,
      province,
      street,
      postcode,
      stocks_number,
      initial_price,
      current_price,
      stock_month_duration)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    RETURNING id, name, logo, street, city, email`,
      [
        name,
        category,
        bio,
        logourl,
        backgroundurl,
        owner_name,
        owner_phone,
        email,
        hashed,
        city,
        province,
        street,
        postcode,
        stockNumber,
        initialPrice,
        initialPrice,
        stockMonthDuration
      ]
    );

    const newShopUser = registerQuery.rows[0];

    await priviledgesQueries.insertMultiplePriviledges(
      newShopUser.id,
      priviledges
    );

    req.session.loginId = `#${newShopUser.id}`;
    res.json({
      success: true,
      id: newShopUser.id,
      name: newShopUser.name,
      address: `${newShopUser.street}, ${newShopUser.city}`,
      email: newShopUser.email,
      userProfile: newShopUser.logo,
      chargesEnabled: false
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
          if (req.session.cart) req.session.cart = null;
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
      shopSI = req.session.shopSI || {};
      Object.keys(req.body.shopSI).forEach(
        key => (shopSI[key] = req.body.shopSI[key])
      );
      req.session.shopSI = shopSI;
    }
    res.json({ success: true });
  } catch (e) {
    console.log(e);
    res
      .status(500)
      .json({ success: false, serverError: true, message: "Errore interno" });
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

/** Updates available passes
 * @param newPasses
 */
router.put("/passes", checkAuth, async (req, res) => {
  try {
    await pool.query(
      "UPDATE shop SET maxpremiums = maxpremiums + $1 WHERE id = $2",
      [req.body.newPasses, req.session.loginId.slice(1)]
    );
    res.json({ success: true });
  } catch (e) {
    console.log(e);
    res.json({
      serverError: true,
      message: "Errore nell'aggiornamento delle informazioni"
    });
  }
});

/** Adds priviledge (service)
 * @param service
 */
router.put("/service", checkAuth, async (req, res) => {
  try {
    await servicesAndGoals.insertMultipleServices(
      req.session.loginId.slice(1),
      [req.body.service]
    );
    res.json({ success: true });
  } catch (e) {
    console.log(e);
    res.json({
      serverError: true,
      message: "Errore nell'aggiornamento delle informazioni"
    });
  }
});

/** Add image to image gallery (shop_image)
 * @param url
 */
router.put("/addImage", checkAuth, async (req, res) => {
  try {
    const shopId = req.session.loginId.slice(1);
    console.log(`Shop ${shopId} is posting an image`);
    await shopQueries.postImages([req.body.url], shopId);
    res.json({ success: true });
  } catch (e) {
    console.log(e);
    res.json({ serverError: true, message: "Errore nel caricare l'immagine" });
  }
});

/** Deletes image from gallery
 * @param url
 */
router.delete("/image", checkAuth, async (req, res) => {
  try {
    const shopId = req.session.loginId.slice(1);
    console.log(`Sho ${shopId} is deleting an image`);
    await shopQueries.deleteImage(req.body.url, shopId);
    res.json({ success: true });
  } catch (e) {
    console.log(e);
    res.json({
      serverError: true,
      message: "Errore nell'eliminazione dell'immagine"
    });
  }
});

/** Reset shop search SI */
router.delete("/shopSI", (req, res) => {
  req.session.shopSI = null;
  res.json({ success: true });
});

module.exports = router;
