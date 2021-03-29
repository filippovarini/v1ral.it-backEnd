const pool = require("../db/db");
/** Checks that there is an admin logged in the session and that that admin
 * is valid
 */
const checkAdmin = async (req, res, next) => {
  try {
    let success = false;
    if (req.session.admin) {
      const admin = await pool.query(
        "SELECT * FROM admin WHERE username = $1",
        [req.session.admin]
      );
      if (admin.rowCount > 0) {
        success = true;
        if ((admin.rows[0].type = "super-admin")) req.superAdmin = true;
      }
    }
    if (success) next();
    else
      res.json({
        success: false,
        unauthorized: true,
        message: "Accesso negato alla pagina"
      });
  } catch (e) {
    console.log(e);
    res.json({
      success: false,
      serverError: true,
      message: "Errore nell'autenticazione dell' utente"
    });
  }
};

module.exports = checkAdmin;
