const transactionQueries = require("../db/queries/transactions");

/** Check that the id passed as transaction id is actually associated with a real
 * transaction. */
const checkTransactionId = async (req, res, next) => {
  try {
    const transaction = await transactionQueries.getFromId(
      req.params.transactionId
    );
    next();
  } catch (e) {
    console.log(e);
    res.status(401).json({ message: "Codice pagamento non valido" });
  }
};

module.exports = checkTransactionId;
