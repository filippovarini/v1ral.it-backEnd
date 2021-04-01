const stripe = require("stripe")(
  "sk_test_51IagnKBGUp477jqhopdGeyrlKAAK8mafYwfMkY19obFaLciF2LR0b9UjizcwAIhQcN2K2TA37p2EOccHZ7UgkZlo00U6LqNkEM"
);
const paymentQueries = require("../db/queries/payments");

/** Check that the intent id is valid and that the intent is succeeded
 * @param intentId
 */
const intentSucceeded = async (req, res, next) => {
  try {
    let intentValid = false;
    const intent = await stripe.paymentIntents.retrieve(req.body.intentId);
    if (intent.status === "succeeded") {
      console.log("intent succeeded");
      // check that it has not been already used
      const intentAlreadyUsed = await paymentQueries.alreadyUsed(
        req.body.intentId
      );
      intentValid = !intentAlreadyUsed;
    }
    if (intentValid) {
      console.log("everything valid! going to post user");
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
