const shopQueries = require("../db/queries/shops");
const premiumQueries = require("../db/queries/premiums");

/** Validates challenger transaction by:
 * - checking that the cart is not empty
 * - getting shop prices from cart
 * - creating a checkout session
 * - DON'T CHECK IF ALREADY BOUGHT AS THAT IS CHECKED ON FRONT_END
 */
const validateChallengerTransaction = async (req, res, next) => {
  try {
    if (!req.session.cart || req.session.cart.length === 0)
      res.json({
        success: false,
        unauthorized: true,
        message: "Carrello vuoto"
      });
    else {
      // success. Create checkout session
      const shops = await shopQueries.getPriceFromIds(req.session.cart);
      const checkout = shops.map(shop => {
        return { id: shop.id, price: shop.currentprice };
      });
      req.session.checkout = checkout;
      next();
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      serverError: true,
      message: "Errore nell'recupero delle informazioni del carrello"
    });
  }
};

module.exports = validateChallengerTransaction;
