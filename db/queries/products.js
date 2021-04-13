const pool = require("../db");
const formatProducts = require("../../functions/formatProducts");

const productsQueries = {
  /** Insert new product
   * @param product.images []
   * @param product with all info
   */
  insert: async product => {
    const { name, price, description, images } = product;
    const insertedProduct = await pool.query(
      `
    INSERT INTO product (name, description, price)
    VALUES ($1, $2, $3) RETURNING id`,
      [name, description, price]
    );
    const values = images.map(image => `($1, '${image}')`).join(", ");

    await pool.query(
      `
    INSERT INTO product_image
    VALUES ${values}`,
      [insertedProduct.rows[0].id]
    );
    return true;
  },
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
  },
  deleteFromId: async id => {
    const productId = parseInt(id);
    await pool.query("DELETE FROM product_image WHERE product = $1", [
      productId
    ]);
    await pool.query("DELETE FROM product WHERE id = $1", [productId]);
    return true;
  }
};

module.exports = productsQueries;
