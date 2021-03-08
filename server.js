const express = require("express");
const path = require("path");
const session = require("express-session");
const mongoose = require("mongoose");
const MongoDBSession = require("connect-mongodb-session")(session);
const pool = require("./db");

// routers
const challengerRouter = require("./routes/Challenger");

const sessionSecret = require("./keys/dev").session;

const app = express();
const port = 5000;

const db =
  "mongodb+srv://filippo:Napoli2018@cluster0.nd0aw.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

mongoose
  .connect(db, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
  })
  .then(() => console.log("Database connected..."))
  .catch(e => console.log(e));

const store = new MongoDBSession({
  uri: db,
  collection: "session"
});

/* MIDDLEWARES */
app.use(express.json());
app.use(
  session({
    secret: sessionSecret,
    saveUninitialized: false,
    resave: false,
    store,
    cookie: {
      sameSite: true
    }
  })
);

const checkAuth = (req, res, next) => {
  if (req.session.loginId) {
  } else {
    res.status(401).json({
      message:
        "Accesso negato al contenuto. Prova ad effettuare il login nuovamente"
    });
  }
};

//routers
app.use("/challenger", challengerRouter);

app.get("/", shit, (req, res) => {
  console.log(req.alfa);
  res.sendFile(path.resolve(__dirname, "client", "index.html"));
});

// app.get("/see", async (req, res) => {
//   pool
//     .query("SELECT * FROM workplace;")
//     .then(r => res.json(r))
//     .catch(e => {
//       console.log(e.message);
//       res.send("shit");
//     });
// });

// app.use("*", (_, res) => {
//   res.status(404).send("404 - nothing found");
// });

app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});
