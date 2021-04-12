const bcrypt = require("bcrypt");
const userQueries = require("../db/queries/users");

/** Class for the user that is being inserted. It might be inserted each info
 * at a time or all in one.
 * @method addInfo adds info to the user inserting session
 * @method save saves user to database
 */
class UserInserter {
  constructor(info, type) {
    this.info = info;
  }

  addInfo(newInfo) {
    this.info = { ...this.info, ...newInfo };
  }

  saveShop = async () => {
    return "none";
  };

  /** Posts User to database
   * @returns user loginId
   */
  saveUser = async () => {
    const {
      username,
      email,
      type,
      challenger,
      city,
      province,
      street,
      postcode,
      profileUrl,
      psw,
      reason,
      name
    } = this.info;
    const hashed = await bcrypt.hash(psw, 10);
    const newUser = await userQueries.register([
      username,
      email,
      type,
      challenger,
      city,
      province,
      street,
      postcode,
      profileUrl,
      hashed,
      reason,
      name
    ]);
    return newUser.rows[0];
  };

  save = async type => {
    let loginId = null;
    switch (type) {
      case "user":
        loginId = await this.saveUser();
        break;
      case "shop":
        loginId = await this.saveShop();
        break;
      default:
        throw Error("UserInserter.type invalid");
    }
    return loginId;
  };
}

module.exports = UserInserter;
