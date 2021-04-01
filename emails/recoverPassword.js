const mailgun = require("./mailgunSetup");

const sendRecoverPasswrodEmail = async (newPsw, email) => {
  var data = {
    from: "The v1rals <info@v1ral.it>",
    to: email,
    subject: "Recupero Password",
    html: `Ciao dai v1rals!<br/>La tua nuova password è ${newPsw}. Ricordati di 
    cambiarla nelle impostazioni account così da non dimenticarla.<br/><br/>
    Saluti, I v1rals`
  };

  try {
    const response = await mailgun.messages().send(data);
    console.log(response);
    return true;
  } catch (e) {
    console.log(`Error with email: ${email}`);
    console.log(e.message);
    return false;
  }
};

module.exports = sendRecoverPasswrodEmail;
