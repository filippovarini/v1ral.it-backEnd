const aws = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");

// authentication credentials
const s3_secret = require("../keys/dev").s3_secret;
const s3_id = require("../keys/dev").s3_key_id;

const maxImageSize = 5 * 1000000;

aws.config.update({
  secretAccessKey: s3_secret,
  accessKeyId: s3_id,
  region: "eu-west-2"
});

var s3 = new aws.S3({});

const fileFilter = (req, file, cb) => {
  if (file.mimetype !== "image/jpeg" && file.mimetype !== "image/png") {
    cb(new Error("Type not allowed, post only jpeg and png"), false);
  } else if (file.size > maxImageSize) {
    console.log("Image too big");
    cb(new Error("Too big, less than 3mb!"));
  } else {
    cb(null, true);
  }
};

var upload = multer({
  //   fileFilter,
  storage: multerS3({
    s3: s3,
    acl: "public-read",
    bucket: "divoc.challenge.images",
    metadata: function(req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function(req, file, cb) {
      cb(null, Date.now().toString());
    }
  })
});

module.exports = upload;
