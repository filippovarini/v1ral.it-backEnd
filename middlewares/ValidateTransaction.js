const shopQueries = require("../db/queries/shops");
const premiumQueries = require("../db/queries/premiums");

/** Validates challenger transaction by:
 * - checking that the cart is not empty
 * - getting shop prices from cart
 * - creating a checkout session
 */
const validateChallengerTransaction = async (req, res, next) => {
  try {
    if (!req.session.cart || req.session.cart.length === 0)
      res.status(401).json({ success: false, message: "Carrello vuoto" });
    else {
      // check not already bought
      const alreadyBought = await premiumQueries.alreadyBought(
        req.session.loginId.slice(1),
        req.session.cart
      );
      if (req.session.loginId && alreadyBought)
        throw "I negozi selezionati sono già stati comprati dallo stesso utente";

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
