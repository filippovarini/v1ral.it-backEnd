var api_key = require("../keys/dev").mailgun;
var domain = "v1ral.it";
var mailgun = require("mailgun-js")({
  apiKey: api_key,
  domain: domain,
  host: "api.eu.mailgun.net"
});

module.exports = mailgun;
