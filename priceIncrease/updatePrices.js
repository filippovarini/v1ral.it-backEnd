const pool = require("../db/db");

/** Updates the price comparing the passes sold that day of a shop with the
 * average of all other shops in the city.
 * To get passes sold yesterday, just gets premium with transaction_date > yday
 * as the algorighm runs at midnight.
 * @todo make prices in shop table  FLOAT. At the moment they are int
 */
const updatePrices = async firedate => {
  console.log("Updating prices");
  console.log(firedate);

  // setting up date
  const now = new Date();
  const yesterday = `${now.getFullYear()}-${now.getMonth() +
    1}-${now.getDate() - 1}`;

  // get new price
  const intPrice =
    "CAST(shops.currentprice + (shops.passes_sold - city_avg) AS INT)";
  const floatPrice = "shops.currentprice + (shops.passes_sold - city_avg)";

  const price = `GREATEST(${intPrice}, shops.initialprice) AS new_price`;

  const updateTable = `
    SELECT 
        *, 
        shops.passes_sold - city_avg AS increase, 
        ${price}
    FROM    (SELECT 
                shop.id, 
                shop.currentprice, 
                shop.initialprice,
                shop.city, 
                COALESCE(COUNT(premiums.*), 0) AS passes_sold
            FROM shop LEFT JOIN ( SELECT * 
                                FROM premium 
                                WHERE premium.transaction_date > '${yesterday}') AS premiums
            ON shop.id = premiums.shop
            GROUP BY shop.id) AS shops 
        NATURAL JOIN 
            (SELECT city, 
                    COALESCE(
                        CAST(SUM(passes_sold) AS FLOAT) / 
                        CAST(COUNT(*) AS FLOAT), 
                        0) AS city_avg
            FROM    (SELECT shop.id, shop.city, COALESCE(COUNT(premiums.*), 0) AS passes_sold
                    FROM shop LEFT JOIN (SELECT * 
                                        FROM premium 
                                        WHERE premium.transaction_date > '${yesterday}') AS premiums
                    ON shop.id = premiums.shop
                    GROUP BY shop.id) AS shops 
            GROUP BY city) AS cityavgs`;

  const query = await pool.query(`
    UPDATE shop
    SET currentprice = update_table.new_price
    FROM (${updateTable}) AS update_table
    WHERE update_table.id = shop.id
    RETURNING *`);
  return query.rows;
};

module.exports = updatePrices;
