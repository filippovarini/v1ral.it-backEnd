const pool = require("../db");
const formatProducts = require("../../functions/formatProducts");

const productsQueries = {
  getList: async () => {
    const products = await pool.query(`
        SELECT *
        FROM product JOIN product_image
            ON product.id = product_image.product`);
    return formatProducts(products.rows);
  },
  getFromIds: async ids => {
    const products = await pool.query(
      `
    SELECT * FROM product JOIN product_image
      ON product.id = product_image.product
    WHERE product.id = ANY ($1)`,
      [ids]
    );
    const formatted = formatProducts(products.rows);
    if (formatted.length !== ids.length)
      throw "Some product id is invalid. Expected " +
        ids.length +
        " but found " +
        formatted.length;
    return formatted;
  }
};

module.exports = productsQueries;
