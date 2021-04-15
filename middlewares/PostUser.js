const bcrypt = require("bcrypt");
// classes
const UserInserter = require("../classes/UserInserter");

const userQueries = require("../db/queries/users");

/**
 * On checkout, create new user, if the user is new.
 * @param req.session.newUser
 */
const postUser = async (req, res, next) => {
  if (!req.session.newUser || !req.session.newUser.username) {
    next();
  } else {
    try {
      const userInserter = new UserInserter(req.session.newUser);
      const user = await userInserter.save("user");
      req.session.loginId = `@${user.username}`;
      req.session.newUser = null;
      next();
    } catch (e) {
      res.status(500).json({
        success: false,
        serverError: true,
        message: "Errore nella registrazione dell'utente"
      });
      console.log(e);
    }
  }
};

module.exports = postUser;
