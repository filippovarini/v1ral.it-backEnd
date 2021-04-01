const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../db/db");

const router = express.Router();

const NEW_PSW_POSSIBILITIES = 1000000;

const sendRecoverPswEmail = require("../emails/recoverPassword");

router.post("/resetPsw", async (req, res) => {
  const { type, email } = req.body;
  const newPsw = `v1ral${Math.floor(Math.random() * NEW_PSW_POSSIBILITIES)}`;
  try {
    const hashed = await bcrypt.hash(newPsw, 10);
    const queryString =
      type === "user"
        ? `UPDATE "user" SET psw = $1 WHERE email = $2 RETURNING *`
        : `UPDATE shop SET psw = $1 WHERE email = $2 RETURNING *`;
    const query = await pool.query(queryString, [hashed, email]);
    switch (query.rowCount) {
      case 0:
        res.json({
          noUser: true,
          message: "Nessun utente registrato con questa email"
        });
        break;
      case 1:
        {
          const emailSuccessful = await sendRecoverPswEmail(newPsw, email);
          if (emailSuccessful) res.json({ success: true });
          else
            res.json({
              emailUnsuccessful: true,
              message:
                "Errore nella spedizione dell'email. Ti consigliamo di riprovare. Se il problema persiste non esitare a contattarci"
            });
        }
        break;
      default:
        throw "Eamil not unique";
    }
  } catch (e) {
    console.log(e);
    res.json({
      serverError: true,
      message:
        "Errore nel reset della password. Email: " + email + " utente: " + type
    });
  }
});

module.exports = router;
