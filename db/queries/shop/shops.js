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
  register: async info => {
    const query = await pool.query(
      `
      INSERT INTO shop(
        "name",
        category,
        maxPremiums,
        initialPrice,
        currentPrice,
        pass_month_duration,
        clicks,
        bio,
        email,
        city,
        province,
        street,
        postcode,
        connectedid ,
        backgroundURL,
        logoURL,
        psw)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING id, name, logourl`,
      info
    );
    return query.rows[0];
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
  }
};

module.exports = shopsQueries;
