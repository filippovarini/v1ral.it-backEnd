/** Checks if there is a login id
 */
const checkAuth = async (req, res, next) => {
  if (req.session.loginId) next();
  else {
    res.json({
      success: false,
      unauthorized: true,
      message:
        "Nessun account connesso. Prova ad effettuare il login nuovamente"
    });
  }
};

module.exports = checkAuth;
