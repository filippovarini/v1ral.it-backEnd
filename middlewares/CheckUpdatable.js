const userUpdatable = [
  "reason",
  "email",
  "profileurl",
  "city",
  "province",
  "street",
  "postcode",
  "profileurl"
];

const shopUpdatable = [
  "category",
  "maxPremiums",
  "bio",
  "email",
  "city",
  "province",
  "street",
  "postcode",
  "backgroundurl",
  "logourl"
];

/** Checks that the info in req.body.update are all present in the relative
 * updatables.
 * @param req.body.update As an object {key: value}
 * */
const checkUpdatable = (req, res, next) => {
  const updatable =
    req.session.loginId[0] === "@" ? userUpdatable : shopUpdatable;
  if (
    req.body.update &&
    Object.keys(req.body.update).every(key => updatable.includes(key))
  )
    next();
  else res.status(401).json({ success: false, message: "Update negato" });
};

module.exports = checkUpdatable;
