const users = require("../db/queries/users");
const shopsSearchQueries = require("../db/queries/shop/shopSearch");

/** Fetches the user from a user name and also gets the list of shops the user
 * is premium in
 * @param username Username of the user
 *
 * @return object to be returned with res.json
 */
const getUserObject = async (username, loggedUser) => {
  const user = await users.getLongInfo(username);
  if (user.length != 1) {
    return {
      success: false,
      invalidUsername: true,
      message: "Username contagiato invalido"
    };
  } else {
    const shopList = await shopsSearchQueries.getPurchasedByUser(
      user[0].username,
      loggedUser
    );
    shopList.forEach(shop => (shop.alreadybought = shop.alreadybought !== 0));
    return { success: true, user: user[0], shops: shopList };
  }
};

module.exports = getUserObject;
