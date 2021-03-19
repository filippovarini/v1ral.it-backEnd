/** Checks that no other user is logged in  */
const checkNotAuth = (req, res, next) => {
  if (req.session.loginId)
    res.status(401).json({ success: false, message: "Utente già connesso" });
  else next();
};

module.exports = checkNotAuth;
