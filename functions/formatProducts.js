/** Format products from array of products with duplicates and unique image url
 * (from join) to an array with unique products and array of images
 *
 * @return [{id, name, description, images }]
 */
const formatProducts = products => {
  const formattedProducts = {};
  products.forEach(product => {
    if (Object.keys(formattedProducts).includes(String(product.id))) {
      formattedProducts[product.id].images.push(product.url);
    } else {
      let productBody = {
        description: product.description,
        images: [product.url],
        price: product.price,
        name: product.name
      };
      formattedProducts[product.id] = productBody;
    }
  });
  const finalFormat = [];
  for (const [id, productObj] of Object.entries(formattedProducts)) {
    finalFormat.push({ ...productObj, id });
  }
  return finalFormat;
};

module.exports = formatProducts;
