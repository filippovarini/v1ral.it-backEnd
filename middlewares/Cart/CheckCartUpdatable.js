/** Checks that the user is allowed to perform the cart update
 * and checks that the product being added to the cart is not a duplicate
 * DOES NOT CHECK THAT THE ID IS VALID!!!
 */
const checkCartUpdatable = async (req, res, next) => {
  if (
    req.session.challenger ||
    (req.session.loginId &&
      (req.session.loginId[0] === "#" || req.session.loginId[0] === "@"))
  ) {
    if (req.session.cart && req.session.cart.includes(req.body.item)) {
      // duplicate
      res.json({
        success: false,
        cartDuplicate: true,
        message: "Non puoi inserire due volte lo stesso prodotto nel carrello"
      });
    } else next();
  } else {
    res.json({
      success: false,
      insertChallenger: true,
      message: "Nessun challenger selezionato o account valido"
    });
  }
};

module.exports = checkCartUpdatable;
