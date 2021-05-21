const stripeKey = require("../../keys/dev").stripe_sk;
const stripe = require("stripe")(stripeKey);

const sendInsufficientBalanceEmail = require("../../emails/insufficientBalance");
const COMMISSION = require("../../statics").commission;

/** On successful payment, sends stripe transfers to connected accounts.
 * If error, return error and send email to myslef
 */
const sendTransfers = async (req, res, next) => {
  try {
    for (const checkout of req.session.checkout) {
      const total = Math.floor(checkout.price * 100 * (1 - COMMISSION));
      const transfer = await stripe.transfers.create({
        amount: total,
        currency: "eur",
        destination: checkout.connected_id,
        transfer_group: req.body.transferGroupId,
        source_transaction: req.session.chargeId
      });
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
