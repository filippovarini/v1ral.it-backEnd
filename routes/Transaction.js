const express = require("express");

const router = express.Router();

// middlewares
const validateCheckout = require("../middlewares/ValidateTransaction");
const postUser = require("../middlewares/PostUser");
const validateShopCheckout = require("../middlewares/ValidateShopCheckout");
const checkShop = require("../middlewares/CheckShop");
const checkCart = require("../middlewares/Cart/CheckCart");
const checkCartUpdatable = require("../middlewares/Cart/CheckCartUpdatable");

// queries
const premiumQueries = require("../db/queries/premiums");
const userQueries = require("../db/queries/users");
const transactionQueries = require("../db/queries/transactions");

/** Gets cart info
 * 1. Checks that there is a cart session
 * 2. Fetches info about the items in the cart
 */
router.get("/cart", checkCart, (req, res) => {
  const items = req.items;
  req.items = null;
  res.json({ success: true, items });
});

/**
 * Parses the checkout request by checking that the user is allowed for checkout
 * (logged in or challenged and has a cart).
 * One done that,
 * - posts stripe tansaction
 * - saves premiums with transaction date
 * - if the user is new, creates new user
 * - deletes cart session
 */
router.post(
  "/challengerCheckout",
  validateCheckout,
  postUser,
  async (req, res) => {
    // post stripe transaction. On success:
    try {
      const transactionDate = new Date();
      const transactionId = transactionDate.getTime();
      const userId = req.session.loginId.slice(1);
      await premiumQueries.insertFromIds(
        userId,
        req.session.checkout,
        transactionDate
      );
      // remove all session data
      req.session.cart = null;
      req.session.checkout = null;
      req.session.shopSI = null;
      req.session.challenger = null;
      res.json({ success: true, transactionId });
    } catch (e) {
      console.log(e);
      await premiumQueries.deleteFromTransactionDate(transactionDate);
      if (req.body.newUser) {
        // just created new user
        await userQueries.delete(req.body.newUser.username);
      }
      res.status(500).json({
        success: false,
        serverError: true,
        message:
          "Errore nel salvataggio dei dati relativi alla transizione. " +
          "Abbiamo dovuto resettare i dati. Ti consigliamo di riprovare. " +
          "Se continui ad avere problemi, non esitare a contattarci!"
      });
    }
  }
);

/** Parses the checkout request by a shop user
 * - posts stripe transaction
 * - saves on shop transaction
 */
router.post(
  "/shopCheckout",
  checkShop,
  validateShopCheckout,
  async (req, res) => {
    // post stripe transaction
    try {
      const transactionDate = new Date();
      const transactionId = transactionDate.getTime();
      const shopId = req.session.loginId.slice(1);
      await transactionQueries.insertFromIds(
        shopId,
        transactionDate,
        req.session.checkout
      );
      // remove all session data
      req.session.cart = null;
      req.session.checkout = null;
      req.session.shopSI = null;
      req.session.challenger = null;
      res.json({ success: true, transactionId });
    } catch (e) {
      // delete transaction
      transactionQueries.deleteFromTransactionId(transactionId);
      console.log(e);
      res.json({
        success: false,
        serverError: true,
        message:
          "Errore nel salvataggio dei dati relativi alla transizione. " +
          "Abbiamo dovuto resettare i dati. Ti consigliamo di riprovare. " +
          "Se continui ad avere problemi, non esitare a contattarci!"
      });
    }
  }
);

/**
 * Add items to the cart. Check that the user doing this action is allowed to do
 * that
 * body: item
 */
router.put("/cart", checkCartUpdatable, (req, res) => {
  // Already validated
  cart = req.session.cart || [];
  cart.push(req.body.item);
  req.session.cart = cart;
  ``;
  res.json({ success: true });
});

/** Removes from cart
 * @param item Id of the shop or product to be removed from cart
 */
router.delete("/cart", (req, res) => {
  if (!req.session.cart)
    res.json({
      success: false,
      cartEmpty: true,
      message: "Nessun carrello salvato nella sessione"
    });
  else {
    req.session.cart = req.session.cart.filter(item => item != req.body.item);
    res.json({ success: true });
  }
});

module.exports = router;
