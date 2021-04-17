CREATE TABLE "shop"
(
    id SERIAL NOT NULL PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    category VARCHAR(64) NOT NULL,
    pass_month_duration INTEGER NOT NULL,
    maxPremiums INTEGER NOT NULL,
    initialPrice INTEGER NOT NULL,
    currentPrice INTEGER NOT NULL,
    clicks INTEGER NOT NULL,
    bio VARCHAR(256) NOT NULL,
    email VARCHAR(256) NOT NULL,
    city VARCHAR(64) NOT NULL,
    province VARCHAR(64) NOT NULL,
    street VARCHAR(256) NOT NULL,
    postcode INTEGER NOT NULL,
    connectedId VARCHAR(256) NOT NULL,
    backgroundURL VARCHAR(512) NOT NULL,
    logoURL VARCHAR(512) NOT NULL,
    psw VARCHAR(256) NOT NULL
);

CREATE TABLE "user"
(
    username VARCHAR(32) NOT NULL PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    email VARCHAR(256) NOT NULL,
    type VARCHAR(16) NOT NULL,
    challenger VARCHAR(32) NOT NULL,
    city VARCHAR(64) NOT NULL,
    province VARCHAR(64) NOT NULL,
    street VARCHAR(256) NOT NULL,
    postcode INTEGER NOT NULL,
    profileUrl VARCHAR(512) NOT NULL,
    psw VARCHAR(256) NOT NULL,
    reason VARCHAR(256)
    --nullable
);

CREATE TABLE "premium"
(
    shop SERIAL NOT NULL,
    "user" VARCHAR(32) NOT NULL,
    price INTEGER NOT NULL,
    transaction_date TIMESTAMP NOT NULL,
    PRIMARY KEY (shop, "user")
);

-- Save table of renewals so that you can get analytics on how many ppl renew
CREATE TABLE "renewal"
(
    shop SERIAL NOT NULL,
    "user" VARCHAR(32) NOT NULL,
    renewal_date TIMESTAMP NOT NULL
)

CREATE TABLE "service"
(
    shop SERIAL NOT NULL,
    name VARCHAR(64) NOT NULL,
    image VARCHAR(512) NOT NULL,
    type VARCHAR(16) NOT NULL,
    PRIMARY KEY (shop, name)
);

CREATE TABLE "goal"
(
    shop SERIAL NOT NULL,
    name VARCHAR(64) NOT NULL,
    amount INTEGER NOT NULL,
    PRIMARY KEY (shop, name)
);


-- product to sell to shops
CREATE TABLE "product"
(
    id SERIAL NOT NULL PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    description VARCHAR(512) NOT NULL,
    price INTEGER NOT NULL
)

CREATE TABLE "product_image"
(
    product SERIAL NOT NULL,
    url VARCHAR(512),
    PRIMARY KEY (product, url)
)

CREATE TABLE "shop_transaction"
(
    date TIMESTAMP NOT NULL,
    shop SERIAL NOT NULL,
    product SERIAL NOT NULL,
    price_then INTEGER NOT NULL,
    PRIMARY KEY(date, shop, product)
)

CREATE TABLE "admin"
(
    username VARCHAR(32) NOT NULL PRIMARY KEY,
    psw VARCHAR(256) NOT NULL
)

CREATE TABLE "website_setting"
(
    type VARCHAR(64) NOT NULL PRIMARY KEY,
    value VARCHAR(64) NOT NULL
)

CREATE TABLE "used_pi"
(
    pi_id VARCHAR(256) NOT NULL PRIMARY KEY
)

CREATE TABLE "bug"
(
    id SERIAL NOT NULL PRIMARY KEY,
    date TIMESTAMP NOT NULL,
    message VARCHAR(256) NOT NULL,
    status VARCHAR(32) NOT NULL
    -- checked / unchecked
)

CREATE TABLE "spam"
(
    id SERIAL NOT NULL PRIMARY KEY,
    date TIMESTAMP NOT NULL,
    shop SERIAL NOT NULL,
    status VARCHAR(32) NOT NULL
)

CREATE TABLE "shop_image"
(
    shop SERIAL NOT NULL,
    url VARCHAR(512) NOT NULL,
    PRIMARY KEY (url, shop)
)