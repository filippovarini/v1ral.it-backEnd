const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../db/db");

// db queries
const userQueries = require("../db/queries/users");

const router = express.Router();

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
      message: "Errore accaduto nel controllare l'originalità dell'username"
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
    provence,
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
      provence,
      street,
      postcode,
      profileUrl,
      hashed,
      reason
    ]);
    req.session.loginId = `@${newUser.rows[0].username}`;
    res.json({ user: newUser.rows[0], success: true });
  } catch (e) {
    res.status(500).json({ message: "Errore nella registrazione dell'utente" });
    console.log(e);
  }
});

/* logs user in: 1. check username exists 2. compare passwords */
router.post("/login", async (req, res) => {
  let success = false;
  try {
    const { login, psw } = req.body;
    const queryString = isEmail(login)
      ? 'SELECT * FROM "user" WHERE email = $1'
      : 'SELECT * FROM "user" WHERE username = $1';
    const query = await pool.query(queryString, [login]);
    if (query.rowCount !== 0) {
      const pswMatch = await bcrypt.compare(psw, query.rows[0].psw);
      if (pswMatch) {
        success = true;
        req.session.loginId = `@${query.rows[0].username}`;
        res.json({ success: true, user: query.rows[0] });
      }
    }
    if (!success)
      res.json({
        success: false,
        message: "Nessun utente con queste credenziali"
      });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Errore nel completamento del login" });
  }
});

router.get("/", (req, res) => {
  console.log("user");
  res.send("user");
});

module.exports = router;
