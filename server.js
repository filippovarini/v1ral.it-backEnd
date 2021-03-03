const express = require("express");

const pool = require("./db");

const app = express();
const port = 5000;

app.use(express.json());

app.get("/", (_, res) => {
  res.send("<h1>Hello World</h1>");
});

app.get("/see", async (req, res) => {
  pool
    .query("SELECT * FROM workplace;")
    .then(r => res.json(r))
    .catch(e => {
      console.log(e.message);
      res.send("shit");
    });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});
