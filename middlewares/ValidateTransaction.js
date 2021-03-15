const shopQueries = require("../db/queries/shops");

/** Validates challenger transaction by:
 * - checking that the cart is not empty
 * - getting shop prices from cart
 * - creating a checkout session
 */
const validateChallengerTransaction = async (req, res, next) => {
  try {
    if (req.session.cart && req.session.cart.length !== 0) {
      // create checkout session
      const shops = await shopQueries.getFromIds(req.session.cart);
      const checkout = shops.map(shop => {
        return { id: shop.id, price: shop.currentprice };
      });
      req.session.checkout = checkout;
      next();
    } else {
      res.status(401).json({ message: "Carrello vuoto" });
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({
      message: "Errore nell'recupero delle informazioni del carrello"
    });
  }
};

module.exports = validateChallengerTransaction;
