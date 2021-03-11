const express = require("express");
const path = require("path");
const session = require("express-session");
const mongoose = require("mongoose");
const MongoDBSession = require("connect-mongodb-session")(session);
const pool = require("./db/db");

// routers
const challengerRouter = require("./routes/Challenger");

// functions
const getUser = require("./HelperFunctions/getUser");

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

app.get("/", (req, res) => {
  console.log(req.alfa);
  res.sendFile(path.resolve(__dirname, "client", "index.html"));
});

app.get("/shit", async (req, res) => {
  console.log("sending");
  const user = await getUser("@sant.ippo");
  console.log(user);
  res.json({ user });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});
