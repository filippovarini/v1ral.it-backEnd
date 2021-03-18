const pool = require("../db");

/** DB STRING QUERIES */
const listQuery = `
SELECT
  shop.id,
  shop.name,
  shop.category,
  shop.maxpremiums,
  shop.currentprice,
  shop.city,
  shop.province,
  shop.logourl,
  shop.bio,
  shop.backgroundurl,
  COALESCE(goalsDone.perc, 0) AS goalsDone,
  COALESCE(goalsDone.premiums, 0) AS premiums
FROM
  shop LEFT JOIN 
  (SELECT goals.shop, 
          SUM(premium.price) / CAST(goals.total AS FLOAT) AS perc, 
          COUNT(*) AS premiums
   FROM premium NATURAL JOIN 
        (SELECT shop, SUM(amount) AS total
         FROM goal
         GROUP BY shop
        ) AS goals
  GROUP BY goals.shop, goals.total) AS goalsDone
ON shop.id = goalsDone.shop`;

/**
 * Shop Queries
 * !! AT the moment NOT OPTIMIZED
 * @todo Optimize queries
 */
const shopsQueries = {
  getList: async () => {
    const shops = await pool.query(listQuery);
    return shops.rows;
  },
  getCities: async () => {
    const cities = await pool.query("SELECT DISTINCT city FROM shop");
    return cities.rows.map(row => row.city);
  },
  /**
   * Get shops by name inserted. Using patterns to get flexible search
   */
  getFromSearch: async (name, city, category) => {
    const namePatterns = name
      .toLowerCase()
      .split(" ")
      .filter(str => str !== "") // make it work even with multiple spaces
      .map((str, i) => (i == 0 ? `%${str}%` : ` ${str}%`))
      .join("");
    const nameFilter = " WHERE LOWER(name) LIKE $1";
    const cityFilter = city ? ` AND LOWER(city) LIKE '%${city}%'` : "";
    const categoryFilter = category
      ? ` AND LOWER(category) LIKE '%${category}%'`
      : "";

    const shops = await pool.query(
      listQuery + nameFilter + cityFilter + categoryFilter,
      [namePatterns]
    );
    return shops.rows;
  },
  getFromId: async id => {
    const shop = await pool.query(listQuery + " WHERE shop.id = $1", [id]);
    if (shop.rowCount !== 1) throw "Id must be unique and valid";
    else return shop.rows[0];
  },
  getOldPsw: async id => {
    const shops = await pool.query(
      "SELECT psw\
      FROM shop\
      WHERE id = $1",
      [id]
    );
    if (shops.rowCount !== 1)
      throw `Username is not unique nor valid. Instead of 1, got ${shops.rowCount} users`;
    else {
      return shops.rows[0].psw;
    }
  },
  getFromIds: async ids => {
    const shops = await pool.query(listQuery + " WHERE shop.id = ANY ($1)", [
      ids
    ]);
    if (shops.rowCount !== ids.length) throw "Ids must be all unique and valid";
    return shops.rows;
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
        clicks,
        bio,
        email,
        city,
        province,
        street,
        postcode,
        connectedId ,
        backgroundURL,
        logoURL,
        psw)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING id`,
      info
    );
    return query.rows[0].id;
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
