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
      res.status(401).json({
        message:
          "Accesso negato perché nessun focolaio è stato ancora selezionato"
      });
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({
      message:
        "Errore nel recuperare le informazioni dei focolai da te selezionati"
    });
  }
};

module.exports = checkCart;
