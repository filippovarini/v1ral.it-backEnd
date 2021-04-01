const express = require("express");
const stripe = require("stripe")(
  "sk_test_51IagnKBGUp477jqhopdGeyrlKAAK8mafYwfMkY19obFaLciF2LR0b9UjizcwAIhQcN2K2TA37p2EOccHZ7UgkZlo00U6LqNkEM"
);

const router = express.Router();

const commission = 0.1;
const shipAgainPrice = 5 * 100;
const accountType = "express";

// functions
const checkChargesEnabled = require("../functions/connectChargesEnabled");

// middlewares
const postUser = require("../middlewares/PostUser");
const checkShop = require("../middlewares/CheckShop");
const checkCart = require("../middlewares/Cart/CheckCart");
const checkCartUpdatable = require("../middlewares/Cart/CheckCartUpdatable");
const validatePayment = require("../middlewares/ValidatePayment");
const ChecknItentSucceeded = require("../middlewares/ChecknItentSucceeded");

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

/** Check if the charges are enabled */
router.get("/chargesEnabled/:connectedId", async (req, res) => {
  try {
    const chargesEnabled = await checkChargesEnabled(req.params.connectedId);
    res.json({ success: true, chargesEnabled });
  } catch (e) {
    console.log(e);
    res.json({
      serverError: true,
      message: "Errore nel controllo di chargesEnabled"
    });
  }
});

/** Gets link for dashboard
 * @param redirectPath path where to redirect
 * @param connectedId
 */
router.post("/dashboard", async (req, res) => {
  try {
    const redirect_url =
      process.env.NODE_ENV === "production"
        ? `https://v1ral.it/${req.body.redirectPath}`
        : `http://localhost:3000/${req.body.redirectPath}`;

    const link = await stripe.accounts.createLoginLink(req.body.connectedId, {
      redirect_url
    });
    res.json({ success: true, url: link.url });
  } catch (e) {
    console.log(e);
    res.json({
      serverError: true,
      message: "Errore nel recupero del link per la dashboard di stripe"
    });
  }
});

/** Gets intention of payment for user (so a direct payment to a connected
 * account). Calculates the payment price from cart and sends back client_secret
 * @param shipAgain whether to add the shipAgain price
 * @todo handle connected id
 */
router.post("/paymentIntent/user", validatePayment, async (req, res) => {
  console.log("PAYMENT INTENT");
  try {
    // total amount asked in cents
    let total =
      req.session.checkout.reduce((acc, item) => acc + item.price, 0) * 100;
    if (req.body.shipAgain) total += shipAgainPrice;
    const transferGroupId = String(new Date().getTime());
    console.log(transferGroupId);

    console.log(total);
    console.log(req.session);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: total,
      currency: "eur",
      payment_method_types: ["card"],
      transfer_group: transferGroupId,
      // Verify your integration in this guide by including this parameter
      metadata: { integration_check: "accept_a_payment" }
    });

    for (const checkout of req.session.checkout) {
      console.log(checkout);
      const total = Math.floor(checkout.price * 100 * (1 - commission));
      console.log(total);
      const transfer = await stripe.transfers.create({
        amount: total,
        currency: "eur",
        destination: checkout.connectedId,
        transfer_group: transferGroupId
      });
      console.log(transfer);
    }

    console.log("everything done");

    // console.log(paymentIntent);

    // res.json({
    //   success: true,
    //   client_secret: paymentIntent.client_secret,
    //   intentId: paymentIntent.id
    // });
  } catch (e) {
    console.log(e);
    if (e.code === "balance_insufficient") {
      res.json({
        serverError: true,
        stripeError: true,
        insufficientBalance: true,
        message: "Errore nella creazione della sessione per il checkout"
      });
    } else
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
router.post(
  "/paymentSuccess/user",
  ChecknItentSucceeded,
  postUser,
  async (req, res) => {
    console.log("middlewares completed");
    const transactionDate = new Date();
    const transactionId = transactionDate.getTime();
    const userId = req.session.loginId.slice(1);
    try {
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
        message: "Errore nel salvataggio dei dati relativi alla transazione"
      });
    }
  }
);

/** Saves user transaction details
 * - checks that the payment intent id is correct and not already used
 * - saves shop transaction
 * @param intentId
 */
router.post(
  "/paymentSuccess/shop",
  checkShop,
  ChecknItentSucceeded,
  async (req, res) => {
    // post stripe transaction
    const transactionDate = new Date();
    const transactionId = transactionDate.getTime();
    const shopId = req.session.loginId.slice(1);
    try {
      await transactionQueries.insertFromIds(
        shopId,
        transactionDate,
        req.session.checkout
      );
      req.session.cart = null;
      req.session.checkout = null;
      req.session.shopSI = null;
      req.session.challenger = null;
      res.json({ success: true, transactionId });
    } catch (e) {
      // delete transaction
      console.log(e);
      transactionQueries.deleteFromTransactionId(transactionId);
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

/** Store new shop user in a register session and create connected account,
 * sending back the new link
 * @param registerSession {shop, goals, services}
 * @todo pre-compile business profile
 */
router.post("/connect", async (req, res) => {
  try {
    console.log("connecting");
    req.session.registerSession = req.body.registerSession;
    const account = await stripe.accounts.create({
      type: accountType,
      country: "IT",
      default_currency: "EUR"
    });

    req.session.registerSession.shop.connectedId = account.id;

    const refresh_url =
      process.env.NODE_ENV === "production"
        ? `https://www.v1ral.it/shop/register/getPayed`
        : `http://localhost:3000/shop/register/getPayed`;

    const return_url =
      process.env.NODE_ENV === "production"
        ? `https://www.v1ral.it/shop/register/done/${account.id}`
        : `http://localhost:3000/shop/register/done/${account.id}`;

    const accountLinks = await stripe.accountLinks.create({
      account: account.id,
      refresh_url,
      return_url,
      type: "account_onboarding"
    });

    res.json({ success: true, url: accountLinks.url });
  } catch (e) {
    console.log(e);
    res.json({
      serverError: true,
      message: "Errore nel connected account onboarding"
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

router.get("/intent", async (req, res) => {
  const intent = await stripe.paymentIntents.retrieve(
    "pi_1Iai7mBGUp477jqhqypV4gBP"
  );
  res.send(intent.status);
});

module.exports = router;
