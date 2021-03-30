const express = require("express");
const stripe = require("stripe")(
  "sk_test_51IagnKBGUp477jqhopdGeyrlKAAK8mafYwfMkY19obFaLciF2LR0b9UjizcwAIhQcN2K2TA37p2EOccHZ7UgkZlo00U6LqNkEM"
);

const router = express.Router();

const commission = 0.1;

// functions
const paymentValid = require("../functions/paymentValid");

// middlewares
const postUser = require("../middlewares/PostUser");
const checkShop = require("../middlewares/CheckShop");
const checkCart = require("../middlewares/Cart/CheckCart");
const checkCartUpdatable = require("../middlewares/Cart/CheckCartUpdatable");
const validatePayment = require("../middlewares/ValidatePayment");

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

/** Gets intention of payment for user (so a direct payment to a connected
 * account). Calculates the payment price from cart and sends back client_secret
 * @param connectedId
 * @param newUser
 * @todo handle connected id
 */
router.post("/paymentIntent/user", validatePayment, async (req, res) => {
  try {
    // total amount asked in cents
    const total =
      req.session.checkout.reduce((acc, item) => acc + item.price, 0) * 100;

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: total,
        currency: "eur",
        payment_method_types: ["card"],
        application_fee_amount: total * commission,
        // Verify your integration in this guide by including this parameter
        metadata: { integration_check: "accept_a_payment" }
      },
      {
        stripeAccount: req.body.connectedId
      }
    );
    res.json({
      success: true,
      client_secret: paymentIntent.client_secret,
      intentId: paymentIntent.id
    });
  } catch (e) {
    console.log(e);
    res.json({
      serverError: true,
      stripeError: true,
      message: "Errore nella creazione della sessione per il checkout"
    });
  }
});

/** Gets intention of payment for shop (so just a normal checkout).
 * Calculates the payment price from cart and sends back client_secret
 */
router.post(
  "/paymentIntent/shop",
  checkShop,
  validatePayment,
  async (req, res) => {
    try {
      // total amount asked in cents
      const total =
        req.session.checkout.reduce((acc, item) => acc + item.price, 0) * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: total,
        currency: "eur",
        payment_method_types: ["card"],
        // Verify your integration in this guide by including this parameter
        metadata: { integration_check: "accept_a_payment" }
      });
      res.json({
        success: true,
        client_secret: paymentIntent.client_secret,
        intentId: paymentIntent.id
      });
    } catch (e) {
      console.log(e);
      res.json({
        serverError: true,
        stripeError: true,
        message: "Errore nella creazione della sessione per il checkout"
      });
    }
  }
);

/** Saves user transaction details
 * - checks that the payment intent id is correct and not already used
 * - saves premiums with transaction date
 * - if the user is new, creates new user
 * - deletes cart session
 * @param intentId
 * @param newUser
 */
router.post("/paymentSuccess/user", postUser, async (req, res) => {
  try {
    const paymentAuthenticated = paymentValid(req.body.intentId);
    if (paymentAuthenticated) {
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
    } else {
      if (req.body.newUser) {
        // just created new user
        await userQueries.delete(req.body.newUser.username);
      }
      res.json({
        success: false,
        intentIdInvalid: true,
        message: "Pagamento non valido!"
      });
    }
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
      message: "Errore nel salvataggio dei dati relativi alla transazione"
    });
  }
});

/** Saves user transaction details
 * - checks that the payment intent id is correct and not already used
 * - saves shop transaction
 * @param intentId
 */
router.post("/paymentSuccess/shop", checkShop, checkShop, async (req, res) => {
  console.log("success");
  // post stripe transaction
  try {
    const paymentAuthenticated = paymentValid(req.body.intentId);
    if (paymentAuthenticated) {
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
    } else {
      res.json({
        success: false,
        intentIdInvalid: true,
        message: "Pagamento non valido!"
      });
    }
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
});

/**
 * Add items to the cart. Check that the user doing this action is allowed to do
 * that
 * @param item
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
