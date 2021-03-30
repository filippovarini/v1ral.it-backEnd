const stripe = require("stripe")(
  "sk_test_51IagnKBGUp477jqhopdGeyrlKAAK8mafYwfMkY19obFaLciF2LR0b9UjizcwAIhQcN2K2TA37p2EOccHZ7UgkZlo00U6LqNkEM"
);

/** CHOOSE PRICE ON BACKEND */

// get client secret

const paymentIntent = await stripe.paymentIntents.create({
  amount: 1099,
  currency: "eur",
  payment_method_types: ["card"],
  application_fee_amount: 123,
  // Verify your integration in this guide by including this parameter
  metadata: { integration_check: "accept_a_payment" }
});

app.get("/secret", async (req, res) => {
  const intent = "payment_intent"; // ... Fetch or create the PaymentIntent
  res.json({ client_secret: intent.client_secret });
});
