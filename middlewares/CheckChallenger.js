const getUser = require("../db/queries/users").getUnique;

/**
 * Checks valid challenger:
 * - has been challenger OR
 * - has an account
 */
const checkChallenger = async (req, res, next) => {
  try {
    if (req.session.challenger) {
      const challengers = await getUser(req.session.challenger);
      switch (challengers.length) {
        case 0:
          req.session.challenger = null;
          console.log("Challenge username is invalid");
          res.json({
            success: false,
            insertChallenger: true,
            message: "L'username del challenger non è valido"
          });
          break;
        case 1:
          next();
          break;
        default:
          req.session.challenger = null;
          console.log("Challenge username is not unique");
          res.json({
            success: false,
            insertChallenger: true,
            message: "L'username del challenger non è unico"
          });
      }
    } else {
      // look for account
      if (req.session.loginId) {
        const users = await getUser(req.session.loginId.slice(1));
        switch (users.length) {
          case 0:
            req.session.loginId = null;
            console.log("Login Id is invalid");
            res.json({
              success: false,
              insertChallenger: false,
              message: "Il tuo username è invalido"
            });
            break;
          case 1:
            next();
            break;
          default:
            req.session.loginId = null;
            console.log("Login Id is not unique");
            res.json({
              success: false,
              insertChallenger: true,
              message: "Il tuo username non è unico"
            });
        }
      } else {
        // no account and no login
        res.json({
          success: false,
          message: "Nessun account o challenger",
          insertChallenger: true
        });
      }
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Errore nell'autenticazione dell'utente" });
  }
};

module.exports = checkChallenger;
