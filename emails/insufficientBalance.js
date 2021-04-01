const mailgun = require("./mailgunSetup");

const sendInsufficientBalanceErrorEmail = async (
  errorCode,
  chargeId,
  username,
  total
) => {
  console.log("sending insufficient balance");
  var data = {
    from: "The v1rals <info@v1ral.it>",
    to: "fppvrn@gmail.com",
    subject: "ERRORE STRIPE ",
    html: `Un pagamento di un challenger è stato appena rifiutato da stripe. 
      Dettagli pagamento: <br/>
      errorCode: ${errorCode}<br/>
      chargeId: ${chargeId}<br/>
      utente: ${username}<br/>
      totale (escluso spedizione): ${total}`
  };

  try {
    const sent = await mailgun.messages().send(data);
    console.log(sent);
    return true;
  } catch (e) {
    console.log(`Error with email: ${email}`);
    console.log(e.message);
    return false;
  }
};

module.exports = sendInsufficientBalanceErrorEmail;
