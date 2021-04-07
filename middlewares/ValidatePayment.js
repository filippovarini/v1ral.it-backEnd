const shopQueries = require("../db/queries/shop/shops");
const shopSearchQueries = require("../db/queries/shop/shopSearch");
const productsQueries = require("../db/queries/products");

/** Validates user transaction by:
 * - checking that the cart is not empty
 * - getting shop prices from cart
 * - creating a checkout session
 * @todo handle checking when already bought (at the moment checked in frontend)
 * @returns session.checkout: [items]
 */
const validatePayment = async (req, res, next) => {
  try {
    if (!req.session.cart || req.session.cart.length === 0)
      res.json({
        success: false,
        unauthorized: true,
        message: "Carrello vuoto"
      });
    else {
      // success. Create checkout session
      const cartItems =
        req.path.split("/").slice(-1)[0] === "shop"
          ? await productsQueries.getFromIds(req.session.cart)
          : await shopSearchQueries.getPriceFromIds(req.session.cart);
      const checkout = cartItems.map(item => {
        return {
          id: item.id,
          price: item.currentprice || item.price,
          connectedId: item.connectedid
        };
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

module.exports = validatePayment;
