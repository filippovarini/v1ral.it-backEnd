const getUser = require("../HelperFunctions/getUser");

const checkAuth = async (req, res, next) => {
  try {
    if (req.session.loginId) {
      const user = await getUser(req.session.loginId);
      if (user !== null) {
        req.user = user;
        next();
      }
    }
    res.status(401).json({
      message:
        "Accesso negato al contenuto. Prova ad effettuare il login nuovamente"
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Errore nell'autenticazione dell'utente" });
  }
};

module.exports = checkAuth;
