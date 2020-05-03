const express = require("express");
const http = require("http");
const morgan = require("morgan");
const helmet = require("helmet");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const passport = require("passport");
const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");
const auth = require("./auth");
const User = require("./Models/User");
// DotENV config
require("dotenv").config();

// Declaring the express app
const app = express();

// Connecting to Database
const dbUrl = process.env.DB_URL || "";
const dbName = process.env.DB_NAME || "";
mongoose
  .connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName,
  })
  .then(() => console.log("Connected to MongoDB..."))
  .catch((error) => console.log("MongoDB Error:\n", error));
mongoose.set("useCreateIndex", true);

// Morgan for logging requests
app.use(morgan("tiny"));

// A little security using helmet
app.use(helmet());

// CORS
app.use(cors());

const server = http.createServer(app);

// JSON parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Cookie middlewares
app.use(
  cookieSession({
    name: "session",
    keys: ["#secretKey"],
  })
);
app.use(cookieParser());

//setting up passport for Auth
auth(passport);
app.use(passport.initialize());

app.get("/", (req, res) => {
  if (req.session.token) {
    res.cookie("token", req.session.token);
    res.json({
      status: "session cookie set",
    });
  } else {
    res.cookie("token", "");
    res.json({
      status: "session cookie not set",
    });
  }
});

app.get(
  "/auth/google",
  passport.authenticate("google", {
    hd: "daiict.ac.in ",
    // prompt: "select_account",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
  })
);
app.get(
  "/googleauth/callback",
  passport.authenticate("google", {
    failureRedirect: "/auth/google",
    failure: "Invalid email address",
  }),
  (req, res) => {
    req.session.token = req.user.token;
    res.redirect("/");
  }
);

app.get("/logout", (req, res) => {
  req.logout();
  req.session = null;
  res.redirect("/");
});

const port = process.env.PORT || 4848;

server.listen(port, () => {
  console.log(
    `Server is running in ${process.env.NODE_ENV} mode on port ${port}...`
  );
});
