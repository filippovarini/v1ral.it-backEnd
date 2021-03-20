/** Checks that no other user is logged in  */
const checkNotAuth = (req, res, next) => {
  if (req.session.loginId)
    res.json({
      success: false,
      unauthorized: true,
      message: "Utente già connesso"
    });
  else next();
};

module.exports = checkNotAuth;
