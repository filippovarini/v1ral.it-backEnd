const productsQueries = require("../db/queries/products");

/** Validates challenger transaction by:
 * - checking that the cart is not empty
 * - getting shop prices from cart
 * - creating a checkout session
 * - DON'T CHECK IF ALREADY BOUGHT AS THAT IS CHECKED ON FRONT_END
 */
const ValidateShopCheckout = async (req, res, next) => {
  try {
    if (!req.session.cart || req.session.cart.length === 0)
      res.json({
        success: false,
        unauthorized: true,
        message: "Carrello vuoto"
      });
    else {
      // success. Create checkout session
      const products = await productsQueries.getFromIds(req.session.cart);
      const checkout = products.map(product => product.id);
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

module.exports = ValidateShopCheckout;
