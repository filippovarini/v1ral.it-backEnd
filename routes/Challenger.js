const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../db/db");

const router = express.Router();

/* checks if the provided login string is an email */
const isEmail = login => {
  return login.includes("@");
};

/* checks uniqueness of username */
router.get("/usernameCheck/:username", async (req, res) => {
  try {
    const query = await pool.query(
      "SELECT username FROM challenger WHERE username = $1",
      [req.params.username]
    );
    if (query.rows.length === 0) {
      res.json({ unique: true });
    } else {
      res.json({ unique: false });
    }
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
    password,
    image,
    country,
    city,
    provence,
    street,
    postcode,
    type
  } = req.body;

  try {
    const hashed = await bcrypt.hash(password, 10);
    const newChallenger = await pool.query(
      "INSERT INTO challenger VALUES($1, $2, $3, $4,$5, $6, $7, $8, $9, $10) RETURNING * ",
      [
        username,
        email,
        type,
        image,
        country,
        city,
        provence,
        street,
        postcode,
        hashed
      ]
    );
    res.json({ ...newChallenger.rows, success: ture });
  } catch (e) {
    res.status(500).json({ message: "Errore nella registrazione dell'utente" });
    console.log(e);
  }
});

/* logs usre in: 1. check username exists 2. compare passwords */
router.post("/login", async (req, res) => {
  try {
    const { login, psw } = req.body;
    const queryString = isEmail(login)
      ? "SELECT psw FROM challenger WHERE email = $1"
      : "SELECT psw FROM challenger WHERE username = $1";
    const query = await pool.query(queryString, [login]);
    if (query.rowCount === 0) res.json({ success: false });

    const pswMatch = await bcrypt.compare(psw, query.rows[0].psw);
    res.json({ success: pswMatch });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Errore nel completamento del login" });
  }
});

module.exports = router;
