const express = require("express");
const http = require("http");
const morgan = require("morgan");
const helmet = require("helmet");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

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

const port = process.env.PORT || 4848;

server.listen(port, () => {
  console.log(
    `Server is running in ${process.env.NODE_ENV} mode on port ${port}...`
  );
});
