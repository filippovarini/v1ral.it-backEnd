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
const servicesAndGoals = require("../db/queries/servicesAndGoals");

/** Register shop from registerSession saved before connecting account.
 * Also check that the account id passed to get to the shop/register/done/:id
 * page is valid
 * @param connectedId id of new connected account passed as query param in shop/
 * register/done/:id
 */
router.post("/register", async (req, res) => {
  try {
    const registerSession = req.session.registerSession;
    if (
      registerSession &&
      registerSession.shop &&
      registerSession.services &&
      registerSession.goals &&
      registerSession.shop.connectedId === req.body.connectedId
    ) {
      const {
        name,
        category,
        maxPremiums,
        initialPrice,
        currentPrice,
        passExpiry,
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
      } = registerSession.shop;

      const hashed = await bcrypt.hash(psw, 10);
      const newShopUser = await shopQueries.register([
        name,
        category,
        maxPremiums,
        initialPrice,
        currentPrice,
        passExpiry,
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
        registerSession.services
      );
      await servicesAndGoals.insertMultipleGoals(
        newShopUser.id,
        registerSession.goals
      );
      // check charges enabled
      const chargesEnabled = await checkChargesEnabled(req.body.connectedId);
      req.session.loginId = `#${newShopUser.id}`;
      req.session.registerSession = null;
      res.json({
        success: true,
        id: newShopUser.id,
        name: newShopUser.name,
        address: `${newShopUser.street}, ${newShopUser.city}`,
        email: newShopUser.email,
        userProfile: newShopUser.logourl,
        chargesEnabled
      });
    } else {
      // no registerSession
      const connectedUsers = await pool.query(
        "SELECT * FROM shop WHERE connectedId = $1",
        [req.body.connectedId]
      );
      if (connectedUsers.rowCount !== 0) {
        const chargesEnabled = await checkChargesEnabled(req.body.connectedId);
        res.json({ success: true, alreadyPresent: true, chargesEnabled });
      } else
        res.json({
          success: false,
          serverError: false,
          unauthorized: true,
          message:
            "Accesso negato perchè non esiste una sessione di registrazione oppure l'id dello stripe account è invalido"
        });
    }
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
