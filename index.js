const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const app = express();
const mongoose = require('mongoose');
require('dotenv').config();
const connectDb = require ('./src/Config/database');

// Connect to the database
connectDb();

const PORT = process.env.PORT || 4000;

mongoose.connection.once('open', () => {
  console.log('Connected to database')
  app.listen(PORT, () => {
    console.log(`Server started on PORT: ${PORT}`);
  });
});



