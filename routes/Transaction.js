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
 * - saves transaction and premiums
 * - if the user is new, creates new user
 * - deletes cart session
 * @todo if request unsuccessful, delete user
 */
router.post(
  "/challengerCheckout",
  validateCheckout,
  postUser,
  async (req, res) => {
    // post stripe transaction. On success:
    try {
      const userId = req.session.loginId.slice(1);
      const transactionId = await transactionQueries.postChallengerTrans(
        req.session.checkout.reduce((acc, shop) => (acc += shop.price), 0),
        userId
      );
      const premiums = await premiumQueries.insertFromIds(
        userId,
        req.session.checkout
      );
      // remove all session data
      req.session.cart = null;
      req.session.checkout = null;
      req.session.shopSI = null;
      req.session.challenger = null;
      res.json({ success: true, transactionId });
    } catch (e) {
      console.log(e);
      await transactionQueries.deleteTransaction(transactionId);
      await premiumQueries.deletePremiums(premiums);
      if (req.body.newUser) {
        // just created new user
        await userQueries.delete;
      }
      res.status(500).json({
        message:
          "Errore nel salvataggio dei dati relativi alla transizione. " +
          "Abbiamo dovuto resettare i dati. Ti consigliamo di riprovare. " +
          "Se continui ad avere problemi, non esitare a contattarci!"
      });
    }
  }
);

module.exports = router;
