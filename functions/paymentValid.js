const stripe = require("stripe")(
  "sk_test_51IagnKBGUp477jqhopdGeyrlKAAK8mafYwfMkY19obFaLciF2LR0b9UjizcwAIhQcN2K2TA37p2EOccHZ7UgkZlo00U6LqNkEM"
);
const paymentQueries = require("../db/queries/payments");

const paymentValid = async piId => {
  console.log("checking validity with id: " + piId);
  const intent = await stripe.paymentIntents.retrieve(piId);
  console.log(intent);
  if (intent.status !== "succeeded") return false;
  else {
    const intentAlreadyUsed = await paymentQueries.alreadyUsed(piId);
    return !intentAlreadyUsed;
  }
};

module.exports = paymentValid;
