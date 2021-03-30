/** Checks if there is a user logged and if the user logged is a shop. */
const checkShop = async (req, res, next) => {
  if (req.session.loginId && req.session.loginId[0] === "#") {
    next();
  } else
    res.json({
      success: false,
      unauthorized: true,
      message: "Nessun utente impresa nella sessione"
    });
};

module.exports = checkShop;
