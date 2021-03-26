const transactionQueries = require("../db/queries/transactions");

/** Check that the id passed as transaction id is actually associated with a real
 * transaction.
 * @param transactionId Is the timestamp of the date object of the transaction */
const checkTransactionId = async (req, res, next) => {
  try {
    const transaction = await transactionQueries.getUserTransaction(
      req.params.transactionId
    );
    next();
  } catch (e) {
    console.log(e);
    res.json({
      success: false,
      unauthorized: true,
      message: "Codice pagamento non valido"
    });
  }
};

module.exports = checkTransactionId;
