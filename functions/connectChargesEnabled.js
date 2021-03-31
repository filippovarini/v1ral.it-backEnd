const stripe = require("stripe")(
  "sk_test_51IagnKBGUp477jqhopdGeyrlKAAK8mafYwfMkY19obFaLciF2LR0b9UjizcwAIhQcN2K2TA37p2EOccHZ7UgkZlo00U6LqNkEM"
);

const connectChargesEnabled = async connectedId => {
  const account = await stripe.accounts.retrieve(connectedId);
  return account.charges_enabled && account.payouts_enabled;
};

module.exports = connectChargesEnabled;
