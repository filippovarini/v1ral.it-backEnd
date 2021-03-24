const users = require("../db/queries/users");
const shops = require("../db/queries/shops");

/** Fetches the user from a user name and also gets the list of shops the user
 * is premium in
 * @param username Username of the user
 *
 * @return object to be returned with res.json
 */
const getUserObject = async username => {
  const user = await users.getLongInfo(username);
  if (user.length != 1) {
    return {
      success: false,
      invalidUsername: true,
      message: "Username contagiato invalido"
    };
  } else {
    const shopList = await shops.getPurchasedByUser(user[0].username);
    return { success: true, user: user[0], shops: shopList };
  }
};

module.exports = getUserObject;
