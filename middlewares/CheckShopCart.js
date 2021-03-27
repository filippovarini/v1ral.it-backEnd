const productsQueries = require("../db/queries/products");

/**
 * @todo CHECK THAT THE SHOPS SELECTED HAVE NOT BEEN ALREADY PURCHASED
 */
const checkShopCart = async (req, res, next) => {
  try {
    if (req.session.cart && req.session.cart.length !== 0) {
      const products = await productsQueries.getFromIds(req.session.cart);
      req.products = products;
      next();
    } else {
      res.json({
        success: false,
        unauthorized: true,
        cartEmpty: true,
        message:
          "Accesso negato perché nessun prodotto è stato ancora selezionato"
      });
    }
  } catch (e) {
    console.log(e);
    res.json({
      success: false,
      serverError: true,
      message:
        "Errore nel recuperare le informazioni dei prodotti da te selezionati"
    });
  }
};

module.exports = checkShopCart;
