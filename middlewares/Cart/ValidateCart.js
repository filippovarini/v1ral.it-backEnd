const pool = require("../../db/db");
const shopSearchQueries = require("../../db/queries/shop/shopSearch");
const productsQueries = require("../../db/queries/products");

insertRenewalPrice = async (cartItems, username) => {
  for (const cartItem of cartItems) {
    if (cartItem.cartType === "renewal") {
      const renewalPriceQuery = await pool.query(
        'SELECT price FROM premium WHERE shop = $1 AND "user" = $2',
        [cartItem.id, username]
      );
      cartItem.renewalPrice = renewalPriceQuery.rows[0].price;
    }
  }
  return cartItems;
};

/**  Validates user cart by:
 * - checking that the cart is not empty
 * - getting shop prices and info from cart
 */
const CheckCart = async (req, res, next) => {
  console.log("validating cart");
  try {
    if (!req.session.cart || req.session.cart.length === 0) {
      res.json({
        success: false,
        unauthorized: true,
        cartEmpty: true,
        message:
          "Accesso negato perché nessun prodotto è stato ancora selezionato"
      });
    } else {
      const ids = req.session.cart.map(cartItem => cartItem.id);
      const items =
        req.session.loginId && req.session.loginId[0] === "#"
          ? await productsQueries.getFromIds(ids)
          : await shopSearchQueries.getFromIds(ids);

      // insert cartType
      let result = items.map(item => {
        const cartItem = req.session.cart.find(cartItem => {
          return Number(cartItem.id) === Number(item.id);
        });
        return {
          ...item,
          cartType: cartItem.type
        };
      });

      if (req.session.cart.some(cartItem => cartItem.type === "renewal"))
        // can slice as one can insert renewal items only if is logged
        result = await insertRenewalPrice(result, req.session.loginId.slice(1));
      req.items = result;
      next();
    }
  } catch (e) {
    console.log(e);
    res.json({
      success: false,
      serverError: true,
      message: "Errore nel recuperare le informazioni sul carrello"
    });
  }
};

module.exports = CheckCart;
