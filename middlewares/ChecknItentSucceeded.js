const stripeKey = require("../keys/dev").stripe_sk;
const stripe = require("stripe")(stripeKey);
const paymentQueries = require("../db/queries/payments");

/** Check that the intent id is valid and that the intent is succeeded
 * @param intentId
 */
const intentSucceeded = async (req, res, next) => {
  try {
    console.log("checking intent succeeded");
    let intentValid = false;
    const intent = await stripe.paymentIntents.retrieve(req.body.intentId);
    if (intent.status === "succeeded") {
      // check that it has not been already used
      const intentAlreadyUsed = await paymentQueries.alreadyUsed(
        req.body.intentId
      );
      intentValid = !intentAlreadyUsed;
    }
    if (intentValid) {
      const chargeId = intent.charges.data.filter(
        charge => charge.status === "succeeded"
      )[0].id;
      req.session.chargeId = chargeId;
      paymentQueries.insertIntent(req.body.intentId);
      next();
    } else {
      res.json({
        success: false,
        intentIdInvalid: true,
        message: "Pagamento non valido!"
      });
    }
  } catch (e) {
    console.log(e);
    res.json({
      success: false,
      serverError: true,
      message:
        "Errore nell'autenticazione del pagamento. " +
        "Abbiamo dovuto resettare i dati. Ti consigliamo di riprovare. " +
        "Se continui ad avere problemi, non esitare a contattarci!"
    });
  }
};

module.exports = intentSucceeded;
