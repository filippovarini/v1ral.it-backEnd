/** Checks that the user has actually searched something */
const shopSI = (req, res, next) => {
  if (req.session.shopSI && req.session.shopSI.name) next();
  else {
    res.status(401).json({
      message: "Nessuna ricerca ancora effettuata"
    });
  }
};

module.exports = shopSI;
