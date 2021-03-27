const shopsQueries = require("../../db/queries/shops");
const productsQueries = require("../../db/queries/products");

/**
 * @todo CHECK THAT THE SHOPS SELECTED HAVE NOT BEEN ALREADY PURCHASED
 */
const checkUserCart = async (req, res, next) => {
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
      const items =
        req.session.loginId && req.session.loginId[0] === "#"
          ? await productsQueries.getFromIds(req.session.cart)
          : await shopsQueries.getFromIds(req.session.cart);
      req.items = items;
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

module.exports = checkUserCart;
