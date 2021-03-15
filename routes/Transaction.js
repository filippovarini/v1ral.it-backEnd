const express = require("express");

const router = express.Router();

// middlewares
const validateCheckout = require("../middlewares/ValidateTransaction");

// queries
const transactionQueries = require("../db/queries/transactions");
const premiumQueries = require("../db/queries/premiums");

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
router.post("/challengerCheckout", validateCheckout, async (req, res) => {
  // post stripe transaction. On success:
  try {
    const userId = req.session.loginId.slice(1);
    console.log("sending first");
    const transactionId = await transactionQueries.postChallengerTrans(
      req.session.checkout.reduce((acc, shop) => (acc += shop.price), 0),
      userId
    );
    console.log("first done");
    await premiumQueries.insertFromIds(userId, req.session.checkout);
    // remove all session data
    req.session.cart = null;
    req.session.checkout = null;
    req.session.shopSI = null;
    req.session.challenger = null;
    res.json({ success: true, transactionId });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      message:
        "Errore nel salvataggio dei dati relativi alla transizione. " +
        "Non ti preoccupare, il pagamento è andato a buon fine e i " +
        "focolai sono stati notificati"
    });
  }
});

module.exports = router;
