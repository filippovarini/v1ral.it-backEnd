const formatDates = require("../../../functions/formatDateNumber");
const pool = require("../../db");
const queriesText = require("../../queriesText");

/**
 * Shop Queries
 * !! AT the moment NOT OPTIMIZED
 * @todo Optimize queries
 */
const shopsQueries = {
  /** Returns long and detalied list of values for shop profile */
  getProfile: async id => {
    const shop = await queriesText.shopProfile(id);
    if (shop.rowCount !== 1) throw "Id must be unique and valid";
    else return shop.rows[0];
  },
  /** Returns the list of cases from a shop formatted in date, number for graph
   * @return {date, number}
   */
  getCases: async id => {
    const cases = await pool.query(
      "SELECT transaction_date AS date FROM premium WHERE shop = $1",
      [id]
    );
    return formatDates(cases.rows);
  },
  /** Get old password from shop */
  getOldPsw: async id => {
    const shops = await pool.query(
      `SELECT psw
      FROM shop
      WHERE id = $1`,
      [id]
    );
    if (shops.rowCount !== 1)
      throw `Username is not unique nor valid. Instead of 1, got ${shops.rowCount} users`;
    else {
      return shops.rows[0].psw;
    }
  },
  /** Get shop gallery images */
  getImages: async shopId => {
    const images = await pool.query(
      "SELECT url FROM shop_image WHERE shop = $1",
      [shopId]
    );
    return images.rows.map(row => row.url);
  },
  /** Add image to shop_image
   * @param urls array of urls to add
   * @param shopId
   */
  postImages: async (urls, shopId) => {
    let values = urls.map(url => `($1, '${url}')`).join(", ");
    await pool.query(`INSERT INTO shop_image VALUES ${values}`, [shopId]);
  },
  /** Increments view count by 1 */
  viewed: async id => {
    await pool.query("UPDATE shop SET clicks = clicks + 1 WHERE id = $1 ", [
      id
    ]);
    return true;
  },
  update: async (id, newInfo) => {
    let setters = "";
    Object.keys(newInfo).forEach(
      (key, i) => (setters += (i == 0 ? "" : ", ") + `${key} = \$${i + 1}`)
    );
    const updatedInfo = await pool.query(
      `
    UPDATE shop
    SET ${setters}
    WHERE id = ${id}
    RETURNING *`,
      Object.values(newInfo)
    );
    if (updatedInfo.rowCount !== 1) throw "Username is not unique or valid";
    else return updatedInfo.rows[0];
  },
  /** Delete image from gallery */
  deleteImage: async (url, shopId) => {
    await pool.query("DELETE FROM shop_image WHERE shop = $1 AND url = $2", [
      shopId,
      url
    ]);
  }
};

module.exports = shopsQueries;
