/** Checks if there is a user logged and if the user logged is a shop. */
const checkShop = async (req, res, next) => {
  if (req.session.loginId && req.session.loginId[0] === "#") {
    next();
  } else
    res.json({
      success: false,
      unauthorized: true,
      message: "Solo i focolai possono vedere la pagina 'diffondi il contagio'"
    });
};

module.exports = checkShop;
