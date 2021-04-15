const schedule = require("node-schedule");
const updatePrices = require("./updatePrices");

/** Runs at midnight (UTC) */
const priceIncreaseSetup = () => {
  console.log("Setting up price increase");
  schedule.scheduleJob("0 0 * * *", updatePrices);
};

module.exports = priceIncreaseSetup;
