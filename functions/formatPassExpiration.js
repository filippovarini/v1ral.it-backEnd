/** Get array of shop objects with
 * @param transaction_date
 * @param pass_month_duration
 * and find the number of days left
 */
const formatPassExpiration = shops => {
  const dayInMillis = 1000 * 60 * 60 * 24;
  const avgDaysInMonth = 30;
  const now = new Date();
  shops.map(shop => {
    const passUsePeriod = Math.ceil(
      (now - new Date(shop.transaction_date)) / dayInMillis
    );
    const daysLeft = shop.pass_month_duration * avgDaysInMonth - passUsePeriod;
    shop.daysLeft = daysLeft;
  });
  return shops;
};

module.exports = formatPassExpiration;
