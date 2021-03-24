const moment = require("moment");

const startDate = "2021-03-01";

var getDaysArray = function(start) {
  for (
    var arr = [], dt = new Date(start);
    dt <= new Date();
    dt.setDate(dt.getDate() + 1)
  ) {
    arr.push(new Date(dt));
  }
  return arr;
};

const daysArray = getDaysArray(startDate);

const formatDates = queryRows => {
  return daysArray.map(day => {
    const formatted = moment(day).format("DD-MM-YYYY");
    return {
      date: formatted,
      number: queryRows.filter(
        row => moment(row.date).format("DD-MM-YYYY") === formatted
      ).length
    };
  });
};

module.exports = formatDates;
