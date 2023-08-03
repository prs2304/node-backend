const mysql = require("mysql2");
const dotenv = require("dotenv");

dotenv.config({path:'./.env'});

const connection = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE,
  // port: process.env.PORT,
});

connection.connect((err) => {
  if (err) {
    console.log("error in connection");
  } else {
    console.log("connected");
  }
});


module.exports =connection;
