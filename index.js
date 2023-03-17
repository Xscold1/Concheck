const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const app = express();
const mongoose = require('mongoose');
require('dotenv').config();
const connectDb = require ('./src/Config/database');
const bodyParser = require('body-parser');
const path = require('path');

// Connect to the database
connectDb();

app.use(express.static("public"));
app.use("/public", express.static(path.join(__dirname, 'public')));

//bodyParser.use(bodyParser.
app.use(bodyParser.urlencoded({ extended:false }));
app.use(bodyParser.json());

//Middlewares
app.use(express.json());
app.use(cors());
app.use(cookieParser());


//routes
const user = require("./src/routes/user/user");
const engineer = require("./src/routes/engineer/engineer");
const admin = require("./src/routes/admin/admin");
const project = require("./src/routes/project/project");
const crew = require("./src/routes/crew/crew");
const company = require("./src/routes/company/company");

// routes and controllers
app.use("/api/user", user);
app.use("/api/admin", admin);
app.use("/api/engineer", engineer);
app.use("/api/crew", crew);
app.use("/api/project", project);
app.use("/api/company", company);

const PORT = process.env.PORT || 4000;

mongoose.connection.once('open', () => {
  console.log('Connected to database')
  app.listen(PORT, () => {
    console.log(`Server started on PORT: ${PORT}`);
  });
});


