const express = require("express");

const router = express.Router();

// middlewares
const validateCheckout = require("../middlewares/ValidateTransaction");
const postUser = require("../middlewares/PostUser");

// queries
const transactionQueries = require("../db/queries/transactions");
const premiumQueries = require("../db/queries/premiums");
const userQueries = require("../db/queries/users");

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

module.exports = router;
