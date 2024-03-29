const express = require("express");
const pool = require("../db/db");

const router = express.Router();

// middlewares
const checkCart = require("../middlewares/Cart/ValidateCart");
const checkTransactionId = require("../middlewares/CheckTransactionId");
const checkAuth = require("../middlewares/CheckAuth");
const checkNotAuth = require("../middlewares/CheckNotAuth");
const checkShop = require("../middlewares/CheckShop");

// queries
const shops = require("../db/queries/shop/shops");
const shopSearchQueries = require("../db/queries/shop/shopSearch");
const priviledgesQueries = require("../db/queries/priviledges");
const cases = require("../db/queries/cases");
const users = require("../db/queries/users");
const premiums = require("../db/queries/premiums");
const products = require("../db/queries/products");
const transactions = require("../db/queries/transactions");

// helper functions
const getUserObject = require("../functions/getUserProfile");
const checkChargesEnabled = require("../functions/connectChargesEnabled");
const isInCart = (session, shopId) => {
  return Boolean(
    session.cart && session.cart.some(cartItem => cartItem.id === shopId)
  );
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
          userProfile: shop.logo,
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
router.get("/home/quickFacts", async (_, res) => {
  try {
    const rtIndex = 0;
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

/** Get list of shops and their value increase */
router.get("/home/priceIncrease", async (_, res) => {
  try {
    const shops = await pool.query(
      "SELECT current_price, initial_price, name, logo FROM shop"
    );

    // turn to camelCase
    res.json({
      success: true,
      shops: shops.rows.map(shop => {
        return {
          name: shop.name,
          logo: shop.logo,
          currentPrice: shop.current_price,
          initialPrice: shop.initial_price
        };
      })
    });
  } catch (e) {
    console.log(e);
    res.json({
      serverError: true,
      message: "Errore nel recuperare l'amuento del valore delle varie imprese"
    });
  }
});

/** Shop search results
 * Accessible even without any search identifier */
router.get("/shops", async (req, res) => {
  try {
    // get useId to show alreadyBought or in cart
    const userId =
      req.session.loginId && req.session.loginId[0] === "@"
        ? req.session.loginId.slice(1)
        : null;

    // get shops
    shopList = await shopSearchQueries.getFromSearch(
      userId,
      req.session.shopSI || {}
    );

    // search for already bought (make boolean)
    shopList.forEach(shop => (shop.alreadyBought = shop.alreadyBought !== 0));

    // search for in cart
    if (req.session.cart)
      shopList.forEach(shop => (shop.inCart = isInCart(req.session, shop.id)));

    // get filter materials
    const cities = await shopSearchQueries.getCities();
    const categories = await shopSearchQueries.getCategories();

    // get challenger info
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
 * @todo check valid id (number)
 */
router.get("/shop/:id", async (req, res) => {
  try {
    let dashboard,
      chargesEnabled,
      added,
      alreadyBought,
      totalSpent = null;

    const shop = await shops.getProfile(req.params.id);
    const priviledges = await priviledgesQueries.getFromId(req.params.id);
    const images = await shops.getImages(req.params.id);

    if (req.session.loginId && req.session.loginId.slice(1) === req.params.id) {
      // dashboard
      dashboard = true;
      totalSpent = await transactions.getShopTransactionTotal(
        req.session.loginId.slice(1)
      );
      chargesEnabled = await checkChargesEnabled(shop.connected_id);
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
      priviledges,
      images,
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
 * sends back shops and whether the user is logged in or has a challenger.
 * Gets user object from logged info or from req.session
 */
router.get("/checkout/user", checkCart, async (req, res) => {
  try {
    const items = req.items;
    req.items = null; // free up req of unnecessary data
    const isLogged = Boolean(
      req.session.loginId && req.session.loginId[0] === "@"
    );
    const challenger = req.session.challenger;
    const user = isLogged
      ? await getUser(req.session.loginId.slice(1))
      : req.session.newUser;
    res.json({ success: true, items, isLogged, challenger, user });
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
router.get("/checkout/shop", checkShop, checkCart, async (req, res) => {
  try {
    const items = req.items;
    req.items = null; // free up req of unnecessary data
    res.json({ success: true, items });
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
router.get("/user/:username", async (req, res) => {
  try {
    const loggedUser = req.session.loginId
      ? req.session.loginId.slice(1)
      : null;
    const dashboard = req.params.username === loggedUser;
    const response = await getUserObject(req.params.username, loggedUser);
    if (response.shops) {
      response.shops.forEach(
        shop => (shop.isInCart = isInCart(req.session, shop.id))
      );
    }
    res.json({ ...response, dashboard });
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

/** Access to register done page is only given to shops that either don't have
 * a connected id yet or don't have charges enabled. (if they have both they can
 * still access it as to buy products) This route checks that and
 * returns the connected_id and loginId
 */
router.get("/registerDone", async (req, res) => {
  try {
    if (req.session.loginId && req.session.loginId[0] === "#") {
      let connected_id = null;
      let chargesEnabled = null;
      if (req.session.connectingId) {
        // store new connected id
        connected_id = req.session.connectingId;
        req.session.connectingId = null;
        await shops.update(req.session.loginId.slice(1), {
          connected_id: connected_id
        });
        chargesEnabled = false;
      } else {
        const shop = await shops.getProfile(req.session.loginId.slice(1));
        connected_id = shop.connected_id;
        chargesEnabled = Boolean(
          shop.connected_id && (await checkChargesEnabled(shop.connected_id))
        );
      }

      res.json({
        success: true,
        loginId: req.session.loginId.slice(1),
        connected_id,
        chargesEnabled
      });
    } else {
      console.log("unauthorized");
      res.json({ unauthorized: true, message: "Accesso negato" });
    }
  } catch (e) {
    console.log(e);
    res.json({
      success: false,
      message: "Errore nel recupero delle informazioni relative ai pagamenti"
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
        product =>
          (product.added = req.session.cart.some(
            cartItem => cartItem.id === product.id
          ))
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
