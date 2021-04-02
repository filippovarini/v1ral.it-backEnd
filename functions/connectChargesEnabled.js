const stripeKey = require("../keys/dev").stripe_sk;
const stripe = require("stripe")(stripeKey);

const connectChargesEnabled = async connectedId => {
  const account = await stripe.accounts.retrieve(connectedId);
  return account.charges_enabled && account.payouts_enabled;
};

module.exports = connectChargesEnabled;
