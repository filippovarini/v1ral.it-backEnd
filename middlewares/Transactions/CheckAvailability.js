const transactionQueries = require("../../db/queries/transactions");

/** Checks that
 * - the products being bought by a shop are available OR
 * - the passes being bought by a user are available */
const checkAvailability = async (req, res, next) => {
  if (req.session.loginId[0] === "@") {
    // user
    const newPassesIds = req.session.checkout
      .filter(item => item.cartType === "pass")
      .map(item => item.id);
    const passesAvailable = await transactionQueries.checkShopPassesAvailability(
      newPassesIds
    );
    if (passesAvailable) next();
    else
      res.json({ message: "Checkout annullato, alcuni pass sono sold out!" });
  } else {
    // shop (for the moment always available)
    next();
  }
};

module.exports = checkAvailability;
