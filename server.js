const express = require("express");
const challengerRouter = require("./routes/Challenger");
const pool = require("./db");

const app = express();
const port = 5000;

// middlewares
app.use(express.json());

//routers
app.use("/challenger", challengerRouter);

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

app.use("*", (_, res) => {
  res.status(404).send("404 - nothing found");
});

app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});
