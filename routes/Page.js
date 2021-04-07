const express = require("express");
const pool = require("../db/db");

const router = express.Router();

// middlewares
const checkUserCart = require("../middlewares/CheckUserCart");
const checkTransactionId = require("../middlewares/CheckTransactionId");
const checkAuth = require("../middlewares/CheckAuth");
const checkNotAuth = require("../middlewares/CheckNotAuth");
const checkShop = require("../middlewares/CheckShop");
const checkShopCart = require("../middlewares/CheckShopCart");

// queries
const cases = require("../db/queries/cases");
const shops = require("../db/queries/shop/shops");
const shopSearchQueries = require("../db/queries/shop/shopSearch");
const users = require("../db/queries/users");
const premiums = require("../db/queries/premiums");
const servicesAndGoals = require("../db/queries/servicesAndGoals");
const products = require("../db/queries/products");
const transactions = require("../db/queries/transactions");

// helper functions
const getUserObject = require("../functions/getUserProfile");
const checkChargesEnabled = require("../functions/connectChargesEnabled");
/** Checks if the user viewing the shop has should see it as added or not */
const isInCart = (session, shopId) => {
  return Boolean(session.cart && session.cart.includes(shopId));
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
          userProfile: user[0].profileurl,
          email: user[0].email,
          address: `${user[0].street}, ${user[0].city}`
        });
        break;
      }
      case "#": {
        const shop = await shops.getProfile(req.session.loginId.slice(1));
        res.json({
          success: true,
          name: "#" + shop.name,
          id: shop.id,
          userProfile: shop.logourl,
          email: shop.email,
          address: `${shop.street}, ${shop.city}`
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
    const shopList = await shopSearchQueries.getList();
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

/** Gets price increase of shops */
router.get("/home/priceIncrease", async (_, res) => {
  try {
    const shops = await pool.query(
      "SELECT currentprice, initialprice, name, logourl FROM shop"
    );
    res.json({ success: true, shops: shops.rows });
  } catch (e) {
    console.log(e);
    res.json({
      serverError: true,
      message: "Errore nel recuperare l'amuento del valore delle varie imprese"
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
    shopList = await shopSearchQueries.getFromSearch(
      userId,
      req.session.shopSI || {}
    );
    // search for already bought (make boolean)
    shopList.forEach(shop => (shop.alreadybought = shop.alreadybought !== 0));
    // search for in cart
    if (req.session.cart)
      shopList.forEach(shop => (shop.inCart = isInCart(req.session, shop.id)));
    const cities = await shopSearchQueries.getCities();
    const categories = await shopSearchQueries.getCategories();
    const challenger = req.session.challenger;
    let challengerViral = null;
    if (challenger) {
      const challengerProfile = await pool.query(
        'SELECT type FROM "user" WHERE username = $1',
        [challenger]
      );
      challengerViral = challengerProfile.rows[0].type === "viral";
    }
    res.json({
      success: true,
      shops: shopList,
      shopSI: req.session.shopSI,
      cities,
      categories,
      challenger: req.session.challenger,
      challengerViral
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
 * Get shop profile. Could be simple shop profile or dashboard. If dashboard,
 * pass to next.
 * - updates view count of shop if simple shop profile
 */
router.get("/shopProfile/:id", async (req, res) => {
  try {
    let dashboard,
      chargesEnabled,
      added,
      alreadyBought,
      totalSpent = null;

    const shop = await shops.getProfile(req.params.id);
    const services = await servicesAndGoals.servicesFromId(req.params.id);
    const goals = await servicesAndGoals.goalsFromId(req.params.id);
    const cases = await shops.getCases(req.params.id);

    if (req.session.loginId && req.session.loginId.slice(1) === req.params.id) {
      // dashboard
      dashboard = true;
      totalSpent = await transactions.getShopTransactionTotal(
        req.session.loginId.slice(1)
      );
      chargesEnabled = await checkChargesEnabled(shop.connectedid);
    } else {
      // just visited the profile (update viewed)
      await shops.viewed(req.params.id);
      added = await isInCart(req.session, parseInt(req.params.id));
      alreadyBought = Boolean(
        !added &&
          req.session.loginId &&
          req.session.loginId[0] === "@" &&
          (await checkAlreadyBought(
            req.session.loginId.slice(1),
            req.params.id
          ))
      );
    }

    res.json({
      success: true,
      shop,
      services,
      goals,
      cases,
      added,
      alreadyBought,
      dashboard,
      totalSpent,
      chargesEnabled
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

/** User Checkout info
 * sends back shops and whether the user is logged in or has a challenger
 */
router.get("/checkout/user", checkUserCart, async (req, res) => {
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

/** Shop Checkout info
 * sends back shops and whether the user is logged in or has a challenger
 */
router.get("/checkout/shop", checkShop, checkShopCart, async (req, res) => {
  try {
    const products = req.products;
    req.products = null; // free up req of unnecessary data
    res.json({ success: true, products });
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
    const loggedUser = req.session.loginId
      ? req.session.loginId.slice(1)
      : null;
    const response = await getUserObject(req.params.username, loggedUser);
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
      const username = req.session.loginId.slice(1);
      const response = await getUserObject(username, username);
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

/** Gets items sold for shops' marketing
 */

router.get("/spread", checkShop, async (req, res) => {
  try {
    let productsList = await products.getList();
    if (req.session.cart)
      productsList.forEach(
        product => (product.added = req.session.cart.includes(product.id))
      );
    res.json({
      success: true,
      products: productsList
    });
  } catch (e) {
    console.log(e);
    res.json({
      serverError: true,
      message: "Errore nel recupero delle informazioni sui prodotti"
    });
  }
});
module.exports = router;
