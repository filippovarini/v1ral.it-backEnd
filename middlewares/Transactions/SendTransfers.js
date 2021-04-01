const stripe = require("stripe")(
  "sk_test_51IagnKBGUp477jqhopdGeyrlKAAK8mafYwfMkY19obFaLciF2LR0b9UjizcwAIhQcN2K2TA37p2EOccHZ7UgkZlo00U6LqNkEM"
);

const sendInsufficientBalanceEmail = require("../../emails/insufficientBalance");
const COMMISSION = require("../../statics").commission;

/** On successful payment, sends stripe transfers to connected accounts.
 * If error, return error and send email to myslef
 */
const sendTransfers = async (req, res, next) => {
  console.log("sending transfers");
  try {
    for (const checkout of req.session.checkout) {
      console.log(checkout);
      const total = Math.floor(checkout.price * 100 * (1 - COMMISSION));
      console.log(total);
      const transfer = await stripe.transfers.create({
        amount: total,
        currency: "eur",
        destination: checkout.connectedId,
        transfer_group: req.body.transferGroupId,
        source_transaction: req.session.chargeId
      });
      console.log(transfer);
    }
    next();
  } catch (e) {
    console.log(e);
    const username = req.session.loginId
      ? req.session.loginId.slice(1)
      : req.body.newUser.username;
    const total =
      req.session.checkout.reduce((acc, item) => acc + item.price, 0) * 100;
    await sendInsufficientBalanceEmail(
      e.code,
      req.session.chargeId,
      username,
      total
    );
    res.json({
      stripeError: true,
      insufficientBalance: true,
      code: e.code,
      message: "Errore nella creazione della sessione per il checkout"
    });
  }
};

module.exports = sendTransfers;
