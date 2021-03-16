const pool = require("../db");

const userQueries = {
  /** Get general user (pattern) */
  getByName: async username => {
    const pattern = `%${username}%`;
    const users = await pool.query(
      'SELECT username, profileurl\
      FROM "user"\
      WHERE LOWER(username) LIKE $1',
      [pattern]
    );
    return users.rows;
  },
  /** Get exact user */
  getUnique: async username => {
    const users = await pool.query(
      'SELECT username, profileurl\
      FROM "user"\
      WHERE LOWER(username) = $1',
      [username]
    );
    return users.rows;
  },
  getList: async () => {
    const users = await pool.query(
      'SELECT "user".username, "user".type, COALESCE(data.rt, 0) AS rt, COALESCE(data.number, 0) AS number\
            FROM "user" LEFT JOIN ((SELECT challenger, COUNT(*) AS rt \
                                   FROM "user" \
                                   GROUP BY challenger) AS challenge \
                                   JOIN \
                                   (SELECT "user", COUNT(*) AS number \
                                    FROM premium \
                                    GROUP BY "user") AS premiums\
                                    ON premiums."user" = challenge.challenger)\
                                    AS data\
                ON "user".username = data."user"'
    );
    return users.rows;
  },
  usernameUnique: async username => {
    const user = await pool.query(
      'SELECT username FROM "user" WHERE username = $1',
      [username]
    );
    if (user.rowCount === 0) return true;

    return false;
  },
  register: async values => {
    const newUser = await pool.query(
      'INSERT INTO "user" VALUES($1, $2, $3, $4,$5, $6, $7, $8, $9, $10, $11) RETURNING * ',
      values
    );
    return newUser;
  },
  update: async (username, newInfo) => {
    let setters = "";
    Object.keys(newInfo).forEach(
      (key, i) => (setters += (i == 0 ? "" : ", ") + `${key} = \$${i + 1}`)
    );
    const updatedInfo = await pool.query(
      `
    UPDATE "user"
    SET ${setters}
    WHERE username = '${username}'
    RETURNING *`,
      Object.values(newInfo)
    );
    if (updatedInfo.rowCount !== 1) throw "Username is not unique or valid";
    else return updatedInfo.rows[0];
  },
  delete: async username => {
    await pool.query('DELETE FROM "user" WHERE username = $1', [username]);
  }
};

module.exports = userQueries;
