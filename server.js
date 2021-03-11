const express = require("express");
const path = require("path");
const session = require("express-session");
const mongoose = require("mongoose");
const MongoDBSession = require("connect-mongodb-session")(session);

// routers
const userRouter = require("./routes/User");
const pageRouter = require("./routes/Pages");

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
  .then(() => console.log("MongoDB connected..."))
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

//routers
app.use("/user", userRouter);
app.use("/page", pageRouter);

app.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, "client", "index.html"));
});

app.use("*", (req, res) => {
  res.send("404 - page not found");
});

app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});
