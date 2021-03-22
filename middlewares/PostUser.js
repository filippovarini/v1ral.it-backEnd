const bcrypt = require("bcrypt");

const userQueries = require("../db/queries/users");

/**
 * On checkout, create new user, if the user is new.
 * @param newUser
 */
const postUser = async (req, res, next) => {
  if (!req.body.newUser) {
    if (req.session.loginId) {
      try {
        const user = await userQueries.getUnique(req.session.loginId.slice(1));
        next();
      } catch (e) {
        console.log(e);
        res.status(500).json({
          success: false,
          serverError: true,
          message: "Username non è unico"
        });
      }
    } else {
      // not authenticated
      res.json({
        success: false,
        unauthorized: true,
        message:
          "Nessun account connesso nè informazione valida per creare nuovo account"
      });
    }
  } else {
    // new user
    const {
      username,
      email,
      type,
      challenger,
      city,
      province,
      street,
      postcode,
      profileUrl,
      psw,
      reason
    } = req.body.newUser;

    try {
      const hashed = await bcrypt.hash(psw, 10);
      const newUser = await userQueries.register([
        username,
        email,
        type,
        challenger,
        city,
        province,
        street,
        postcode,
        profileUrl,
        hashed,
        reason
      ]);
      req.session.loginId = `@${newUser.rows[0].username}`;
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
