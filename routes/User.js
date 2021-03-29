const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../db/db");

const router = express.Router();

// middlewares
const checkAuth = require("../middlewares/CheckAuth");
const checkUpdatable = require("../middlewares/CheckUpdatable");

// db queries
const userQueries = require("../db/queries/users");

/* checks if the provided login string is an email */
const isEmail = login => {
  return login.includes("@");
};

/* checks uniqueness of username */
router.get("/usernameCheck/:username", async (req, res) => {
  try {
    const unique = await userQueries.usernameUnique(req.params.username);
    res.json({ unique });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      serverError: true,
      message: "Errore nel controllare l'originalità dell'username"
    });
  }
});

/**
 * Find list of users with similar username
 * Pre: Already checked that the username is ONLY ONE WORD
 */
router.get("/name/:username", async (req, res) => {
  try {
    const users = await userQueries.getLongInfo(req.params.username);
    res.json({ success: true, users });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      serverError: true,
      message: "Errore nella ricerca di profili con l'username da te inserito"
    });
  }
});

/* inserts new challenger in table */
router.post("/register", async (req, res) => {
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
  } = req.body;

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
    res.json({ user: newUser.rows[0], success: true });
  } catch (e) {
    res.status(500).json({
      success: false,
      serverError: true,
      message: "Errore nella registrazione dell'utente"
    });
    console.log(e);
  }
});

/* logs user in: 1. check username exists 2. compare passwords */
router.post("/login", async (req, res) => {
  try {
    let success = false;
    const { login, psw } = req.body;
    const queryString = isEmail(login)
      ? 'SELECT * FROM "user" WHERE email = $1'
      : 'SELECT * FROM "user" WHERE username = $1';
    const query = await pool.query(queryString, [login]);
    if (query.rowCount !== 0) {
      if (query.rowCount > 1) throw "Username or email must be unique";
      else {
        const pswMatch = await bcrypt.compare(psw, query.rows[0].psw);
        if (pswMatch) {
          success = true;
          if (req.session.cart) req.session.cart = null;
          req.session.loginId = `@${query.rows[0].username}`;
          res.json({ success: true, user: query.rows[0] });
        }
      }
      if (!success)
        res.json({
          success: false,
          message: "Nessun utente con queste credenziali"
        });
    } else res.json({ success: false, message: "Username non valido" });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      serverError: true,
      message: "Errore nel completamento del login"
    });
  }
});

/**
 * Save challenger id.
 * Receive from frontend UNIQUE challenger username
 */
router.post("/challenger", async (req, res) => {
  try {
    // check exists unique
    await userQueries.getUnique(req.body.challenger);
    req.session.challenger = req.body.challenger;
    res.json({ success: true });
  } catch (e) {
    console.log(e);
    res.json({
      success: false,
      message: "Errore nel connettere la sessione con lo sfidante selezionato"
    });
  }
});

/**
 * Save user search identifier (userSI) to session
 */
router.put("/search", (req, res) => {
  req.session.userSI = req.body.userSI;
  res.json({ success: true });
});

/** Updates user info
 * Doesn't checkAuth as to click button you need to have checked it
 * @todo use a safer middleware to handle requests not from browser
 * @param update object with values to edit
 * @param oldPsw?, newPsw? for password
 */
router.put("/updateInfo", checkAuth, checkUpdatable, async (req, res) => {
  try {
    if (req.session.loginId[0] !== "@")
      throw `LoginId prefix should be @ but is ${req.session.loginId[0]}`;
    const username = req.session.loginId.slice(1);
    let update = req.body.update;
    if (req.body.oldPsw) {
      const newHashedPsw = await checkPswUpdate(
        req.body.oldPsw,
        req.body.newPsw,
        username
      );
      if (!newHashedPsw) {
        res.json({
          success: false,
          pswInvalid: true
        });
      } else update = { ...req.body.update, psw: newHashedPsw };
    }
    const user = await userQueries.update(username, update);
    res.json({ success: true, user });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      serverError: true,
      message: "Errore nel salvataggio delle modifiche. Prova a riprovare"
    });
  }
});

const checkPswUpdate = async (oldPsw, newPsw, username) => {
  const dbPsw = await userQueries.getOldPsw(username);
  const pswMatch = await bcrypt.compare(oldPsw, dbPsw);
  if (pswMatch) {
    const hashed = await bcrypt.hash(newPsw, 10);
    return hashed;
  } else return false;
};

module.exports = router;
