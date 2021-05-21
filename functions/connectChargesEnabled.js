const stripeKey = require("../keys/dev").stripe_sk;
const stripe = require("stripe")(stripeKey);

const connectChargesEnabled = async connected_id => {
  const account = await stripe.accounts.retrieve(connected_id);
  return account.charges_enabled && account.payouts_enabled;
};

module.exports = connectChargesEnabled;
