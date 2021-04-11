const allowedCartTypes = {
  user: ["pass", "renewal"],
  shop: ["product"]
};

/** Check if cart is duplicate */
const checkCartDuplicate = (cart, item) => {
  let cartDuplicate = false;
  cart.forEach(cartItem => {
    if (cartItem.id === item.id && cartItem.type === item.type)
      cartDuplicate = true;
  });
  return cartDuplicate;
};

/** Checks that the user is allowed to perform the cart update
 * and checks that the product being added to the cart is not a duplicate
 * DOES NOT CHECK THAT THE ID IS VALID!!!
 * @param item id of cart item and type of cart item (product/renewal/pass)
 */
const checkCartUpdatable = async (req, res, next) => {
  const loginId = req.session.loginId;
  const userCartValid =
    allowedCartTypes.user.includes(req.body.item.type) &&
    (req.session.challenger || (req.session.loginId && loginId[0] === "@"));

  const shopCartValid =
    allowedCartTypes.shop.includes(req.body.item.type) &&
    req.session.loginId &&
    loginId[0] === "#";
  if (userCartValid || shopCartValid) {
    if (
      req.session.cart &&
      req.session.cart.some(item => item.id === req.body.item.id)
    ) {
      // duplicate
      res.json({
        success: false,
        cartDuplicate: true,
        message: "Non puoi inserire due volte lo stesso prodotto nel carrello"
      });
    } else next();
  } else
    res.json({
      success: false,
      insertChallenger: true,
      message:
        "Nessun challenger selezionato o account valido o tipologia prodotto invalida"
    });
};

module.exports = checkCartUpdatable;
