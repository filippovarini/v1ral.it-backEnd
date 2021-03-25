const express = require("express");
const pool = require("../db/db");

const router = express.Router();

// middlewares
const checkCart = require("../middlewares/CheckCart");
const checkTransactionId = require("../middlewares/CheckTransactionId");
const checkAuth = require("../middlewares/CheckAuth");
const checkNotAuth = require("../middlewares/CheckNotAuth");

// queries
const cases = require("../db/queries/cases");
const shops = require("../db/queries/shops");
const users = require("../db/queries/users");
const premiums = require("../db/queries/premiums");
const servicesAndGoals = require("../db/queries/servicesAndGoals");

// helper functions
const getUserObject = require("../functions/getUserProfile");
/** Checks if the user viewing the shop has should see it as added or not */
const isInCart = (session, shopId) => {
  return session.cart && session.cart.includes(shopId);
};

/** Fetches full info of a user. */
const getUser = async userId => {
  const user = await pool.query('SELECT * FROM "user" WHERE username = $1', [
    userId
  ]);
  if (user.rowCount !== 1)
    throw "Username should be unique and valid. Expected 1 result, but got: " +
      user.rowCount;
  return user.rows[0];
};

/** Checks if the shop has already been purchased by the user */
const checkAlreadyBought = async (userId, shopId) => {
  return await premiums.alreadyBought(userId, [shopId]);
};

/** Gets name and profile for header */
router.get("/header", checkAuth, async (req, res) => {
  try {
    switch (req.session.loginId[0]) {
      case "@": {
        const user = await users.getUnique(req.session.loginId.slice(1));
        res.json({
          success: true,
          name: "@" + user[0].username,
          id: user[0].username,
          userProfile: user[0].profileurl
        });
        break;
      }
      case "#": {
        const shop = await shops.getProfile(req.session.loginId.slice(1));
        res.json({
          success: true,
          name: "#" + shop[0].name,
          id: shop[0].id,
          userProfile: shop[0].logourl
        });
        break;
      }
      default:
        throw "Username prefix is invalid. Got " + req.session.loginId[0];
    }
  } catch (e) {
    console.log(e);
    res.json({
      serverError: true,
      success: false,
      message: "Errore nel recuperare le informazioni dell'utente registrato"
    });
  }
});

/* HOME */
router.get("/home/quickFacts", async (req, res) => {
  try {
    const rtIndex = await cases.avgRt();
    const totalCases = await cases.total();
    const dailyCases = await cases.daily();
    const financedShops = await cases.financedShops();
    const dailyFinancedShops = await cases.dailyFinancedShops();
    res.json({
      success: true,
      info: {
        rtIndex,
        totalCases,
        dailyCases,
        financedShops,
        dailyFinancedShops
      }
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      serverError: true,
      message: "Errore nella richiesta di dati"
    });
  }
});

router.get("/home/shops", async (req, res) => {
  try {
    const shopList = await shops.getList();
    res.json({ success: true, shopList });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      serverError: true,
      message: "Errore nella richiesta di dati"
    });
  }
});

router.get("/home/users", async (req, res) => {
  try {
    const userList = await users.getList();
    res.json({ success: true, userList });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      serverError: true,
      message: "Errore nella richiesta di dati"
    });
  }
});

/** Shop search results */
/** Accessible even without any search identifier */
router.get("/shops", async (req, res) => {
  try {
    const userId =
      req.session.loginId && req.session.loginId[0] === "@"
        ? req.session.loginId.slice(1)
        : null;
    if (req.session.shopSI) {
      const { name, city, category } = req.session.shopSI;
      shopList = await shops.getFromSearch(name, city, category, userId);
    } else shopList = await shops.getList(userId);
    // search for already bought (make boolean)
    shopList.forEach(shop => (shop.alreadybought = shop.alreadybought !== 0));
    // search for in cart
    if (req.session.cart)
      shopList.forEach(shop => (shop.inCart = isInCart(req.session, shop.id)));
    const cities = await shops.getCities();
    const categories = await shops.getCategories();
    res.json({
      success: true,
      shops: shopList,
      shopSI: req.session.shopSI,
      cities,
      categories
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      serverError: true,
      message: "Errore nella ricerca delle imprese nel database"
    });
  }
});

/**
 * On Front-End, get /shopProfile/:id.
 * Send request to /page/shopProfile/:id
 * - updates view count of shop
 */
router.get("/shopProfile/:id", async (req, res) => {
  try {
    shops.viewed(req.params.id);
    const shop = await shops.getProfileInfo(req.params.id);
    const services = await servicesAndGoals.servicesFromId(req.params.id);
    const goals = await servicesAndGoals.goalsFromId(req.params.id);
    const added = await isInCart(req.session, parseInt(req.params.id));
    const cases = await shops.getCases(req.params.id);
    const alreadyBought =
      !added &&
      req.session.loginId &&
      req.session.loginId[0] === "@" &&
      (await checkAlreadyBought(req.session.loginId.slice(1), req.params.id));
    res.json({
      success: true,
      shop,
      services,
      goals,
      cases,
      added,
      alreadyBought
    });
  } catch (e) {
    console.log(e);
    if (e === "Id must be unique and valid") {
      res.status(500).json({
        success: false,
        serverError: false,
        invalidShopId: true,
        message: "Id del focolaio invalido"
      });
    }
    res.status(500).json({
      success: false,
      serverError: true,
      message: "Errore nel connetersi alle informazioni del negozio"
    });
  }
});

/** Checkout info
 * sends back shops and whether the user is logged in or has a challenger
 */
router.get("/checkout", checkCart, async (req, res) => {
  try {
    const shops = req.shops;
    req.shops = null; // free up req of unnecessary data
    const isLogged = Boolean(
      req.session.loginId && req.session.loginId[0] === "@"
    );
    const challenger = req.session.challenger;
    const user = isLogged ? await getUser(req.session.loginId.slice(1)) : null;
    res.json({ success: true, shops, isLogged, challenger, user });
  } catch (e) {
    console.log(e);
    res.json({
      success: false,
      error: true,
      message: "Errore nel recupero delle informazioni sull'utente~"
    });
  }
});

/** Checkout confirmation
 * - validates transaction id
 * - sends back authentication
 */
router.get("/success/:transactionId", checkTransactionId, async (req, res) => {
  res.json({ success: true, transactionId: req.params.transactionId });
});

/** User search results
 * get username from query params.
 */
router.get("/users/:username", async (req, res) => {
  try {
    const userList = await users.getLongInfo(req.params.username);
    res.json({ success: true, users: userList });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      serverError: true,
      message: "Errore nel recupero delle informazioni sugli utenti"
    });
  }
});

/** Send back single user info
 * get  username from query params
 */
router.get("/userProfile/:username", async (req, res) => {
  try {
    const response = await getUserObject(req.params.username);
    res.json(response);
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      serverError: true,
      message: "Errore nel recupero delle informazioni sul profilo dell'utente"
    });
  }
});

/* LOG IN - REGISTER */
router.get("/login", checkNotAuth, (req, res) => {
  res.json({ success: true });
});

/* DASHBOARDS */

/** USED FOR DASHBOARD AND SETTINGS
 * Checks if there is a valid loginId
 * Fetches user info
 */
router.get("/dashboard/user", checkAuth, async (req, res) => {
  try {
    if (req.session.loginId[0] !== "@")
      throw `LoginId prefix should be @ but is ${req.session.loginId[0]}`;
    else {
      const response = await getUserObject(req.session.loginId.slice(1));
      res.json(response);
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      serverError: true,
      message:
        "Errore nel recupero delle informazioni dell'utente per la dashboard"
    });
  }
});

/** Get user info for settings */
router.get("/user/settings", checkAuth, async (req, res) => {
  try {
    if (req.session.loginId[0] !== "@")
      throw `LoginId prefix should be @ but is ${req.session.loginId[0]}`;
    else {
      const user = await getUser(req.session.loginId.slice(1));
      res.json({ success: true, user });
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      serverError: true,
      message:
        "Errore nel recupero delle informazioni dell'utente per i settings"
    });
  }
});

/** USED FOR DASHBOARD AND SETTINGS
 * Checks if there is a valid loginId
 * Fetches shop info
 */
router.get("/dashboard/shop", checkAuth, async (req, res) => {
  try {
    if (req.session.loginId[0] !== "#") {
      res.json({
        success: false,
        unauthorized: true,
        message: "Contagiato non autorizzato alla dashboard di un focolaio"
      });
    } else {
      const shopId = req.session.loginId.slice(1);
      const shop = await shops.getDashboardInfo(shopId);
      const services = await servicesAndGoals.servicesFromId(shopId);
      const goals = await servicesAndGoals.goalsFromId(shopId);
      const cases = await shops.getCases(shopId);
      res.json({ success: true, shop, services, goals, cases });
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      serverError: true,
      message: "Shop ID non valido o non unico"
    });
  }
});

module.exports = router;
