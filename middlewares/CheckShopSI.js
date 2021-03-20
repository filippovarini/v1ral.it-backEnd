/** Checks that the user has actually searched something */
const shopSI = (req, res, next) => {
  if (req.session.shopSI && req.session.shopSI.name) next();
  else {
    res.json({
      success: false,
      unauthorized: true,
      message: "Nessuna ricerca ancora effettuata"
    });
  }
};

module.exports = shopSI;
