/** Get a list of shops and inserts blank objects where ids are missing so that
 * if that array is missing any shop, we get a blank object
 * @param maxId Maximum id before which we need to insert blank objects for the
 * array
 * @param shops array of shops that might have blank gaps
 */
const insertBlankShops = (maxId, shops) => {
  for (let i = 0; i <= maxId; i++) {
    if (!shops[i] || shops[i].shop !== i) shops.splice(i, 0, { shop: i });
  }
  return shops;
};

module.exports = insertBlankShops;
