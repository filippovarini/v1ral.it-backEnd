const getFromIds = require("../db/queries/shops").getFromIds;

/**
 * @todo CHECK THAT THE SHOPS SELECTED HAVE NOT BEEN ALREADY PURCHASED
 */
const checkCart = async (req, res, next) => {
  try {
    if (req.session.cart) {
      const shops = await getFromIds(req.session.cart);
      req.shops = shops;
      next();
    } else {
      res.json({
        success: false,
        unauthorized: true,
        cartEmpty: true,
        message:
          "Accesso negato perché nessun focolaio è stato ancora selezionato"
      });
    }
  } catch (e) {
    console.log(e);
    res.json({
      success: false,
      serverError: true,
      message:
        "Errore nel recuperare le informazioni dei focolai da te selezionati"
    });
  }
};

module.exports = checkCart;
