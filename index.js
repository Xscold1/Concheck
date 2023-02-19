const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const app = express();
const mongoose = require('mongoose');
require('dotenv').config();
const connectDb = require ('./src/Config/database');

// Connect to the database
connectDb();

//Middlewares
app.use(express.json());
app.use(cors());
app.use(cookieParser());

//routes
const user = require("./src/routes/user/user");
const engineer = require("./src/routes/engineer/engineer");
//const project = require("./src/routes/project/project");
// routes and controllers
app.use("/api/user", user);

const PORT = process.env.PORT || 2000;

mongoose.connection.once('open', () => {
  console.log('Connected to database')
  app.listen(PORT, () => {
    console.log(`Server started on PORT: ${PORT}`);
  });
});


