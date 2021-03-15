const shopQueries = require("../db/queries/shops");
const userQueries = require("../db/queries/users");

/** Validates challenger transaction by:
 * - checking that the cart is not empty
 * - getting shop prices from cart
 * - creating a checkout session
 */
const validateChallengerTransaction = async (req, res, next) => {
  if (!req.session.loginId)
    res.status(401).json({ message: "Nessun utente creato" });
  else {
    // user logged in
    const user = await userQueries.getUnique(req.session.loginId.slice(1));
    if (user.length !== 1) throw "User id is not unique or valid";
    else {
      // check cart
      if (req.session.cart && req.session.cart.length !== 0) {
        // create checkout session
        const shops = await shopQueries.getFromIds(req.session.cart);
        const checkout = shops.map(shop => {
          return { id: shop.id, price: shop.currentprice };
        });
        console.log(checkout);
        req.session.checkout = checkout;
        next();
      } else {
        res.status(401).json({ message: "Carrello vuoto" });
      }
    }
  }
};

module.exports = validateChallengerTransaction;
