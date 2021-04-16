/** Validates user transaction by getting the items in the cart and creating
 * a checkout session
 * Called after CHECKCART (which validates the cart and gets the items)
 * @todo handle checking when already bought (at the moment checked in frontend)
 * @returns session.checkout: [items]
 */
const validatePayment = async (req, res, next) => {
  // success. Create checkout session
  const cartItems = req.items;
  req.items = null;
  const checkout = cartItems.map(item => {
    return {
      id: item.id,
      price: item.renewalPrice || item.currentprice || item.price,
      connectedId: item.connectedid,
      cartType: item.cartType
    };
  });
  req.session.checkout = checkout;
  next();
};

module.exports = validatePayment;
