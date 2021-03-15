const express = require("express");

const router = express.router();

// queries
const transactionQueries = require("../db/queries/transactions");
const premiumQueries = require("../db/queries/premiums");

/**
 * Parses the checkout request by checking that the user is allowed for checkout
 * (logged in or challenged and has a cart).
 * One done that,
 * - saves transaction
 * - deletes cart session
 */
router.post(
  "challengerCheckout",
  /* checkValidity, */ (req, res) => {
    transactionQueries
      .postChallengerTrans(req.total, userId.slice(1))
      .then(() => {
        // insertion successful
      });
  }
);
