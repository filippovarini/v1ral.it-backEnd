const express = require("express");
const path = require("path");
const session = require("express-session");
const mongoose = require("mongoose");
const MongoDBSession = require("connect-mongodb-session")(session);
const sessionSecret = require("./keys/dev").session;
const priceIncreaseSetUp = require("./priceIncrease/setUp");

// run scheduler for price increase
priceIncreaseSetUp();

// db queries
const adminQueries = require("./db/queries/admin");

// multer s3
// multer upload
const upload = require("./services/file-upload");
const singleUpload = upload.single("image");

// routers
const userRouter = require("./routes/User");
const pageRouter = require("./routes/Page");
const shopRouter = require("./routes/Shop");
const transactionRouter = require("./routes/Transaction");
const adminRouter = require("./routes/Admin");
const generalUserRouter = require("./routes/GeneralUser");

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
app.use("/shop", shopRouter);
app.use("/transaction", transactionRouter);
app.use("/admin", adminRouter);
app.use("/users", generalUserRouter);

app.get("/error", (req, res) => {
  res.send("in server");
});

if (process.env.NODE_ENV === "production") {
  // Set static folder
  app.use(express.static("client/build"));
  app.get("/", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
}

app.get("/session", (req, res) => {
  res.json({ session: req.session });
});

/** Checks whether the website is on maintenance */
app.get("/maintenance", async (req, res) => {
  try {
    const status = await adminQueries.getMaintenanceStatus();
    res.json({
      success: true,
      maintenance: status === "on" && req.hostname !== "localhost"
    });
  } catch (e) {
    console.log(e);
    res.json({
      serverError: true,
      message:
        "Errore nel recuperare le informazioni sullo stato di manutenzione del sito"
    });
  }
});

/** Post any kind of image to s3 and get back an url */
app.post("/image", (req, res) => {
  singleUpload(req, res, error => {
    if (error) {
      console.log(error);
      return res.json({
        success: false,
        serverError: true,
        message: "Errore nel caricamento dell'imagine"
      });
    } else {
      return res.json({ success: true, url: req.file.location });
    }
  });
});

app.put("/logout", async (req, res) => {
  await req.session.destroy();
  res.json({ success: true });
});

app.use("*", (req, res) => {
  res.send("404 - page not found");
});

app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});
