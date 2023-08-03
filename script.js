const { urlencoded, json, static } = require("express");
const connection = require("./config.js");
const express = require("express");
const upload = require("./middleware/postman");
const app = express();
const { v4: uuidv4 } = require("uuid");
const cors = require("cors");
const { join } = require("path");
/// cookies
const bcryptJs = require("bcryptjs");
const cookieParser = require("cookie-parser");
const { createTokens, validateToken } = require("./JWT");
const { sign, verify } = require("jsonwebtoken");

app.use(urlencoded({ extended: true }));
app.use(json());
app.use(cookieParser());
app.use(
  cors({
    // origin: "http://localhost:3000",
  })
);
app.use("/static/file", static(join(process.cwd() + "/uploads")));

const verifyJWT = (req, res, next) => {
  const token = req.headers["x-access-token"];

  if (!token) {
    res.send("No Token Found!");
  } else {
    verify(token, "jwtsecret", (err, decoded) => {
      if (err) {
        res.json({ auth: false, message: "authentication failed" });
      } else {
        req.userId = decoded.id;
        next();
      }
    });
  }
};

app.post("/upload", upload, async (req, res) => {
  // Handle Cors
  // res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');

  //Create table
  const checkIfTableExists = `SELECT * FROM file_store;`;

  connection.query(checkIfTableExists, (err, result) => {
    if (err) {
      console.log("Error", err);
      if (err.errno === 1146) {
        // if table not exist, then create table first
        const createTable = `create table file_store(file_id varchar(255), file_name varchar(255), file_object varchar(1000), upload_date_time datetime);`;
        connection.query(createTable, (err, result) => {
          if (err) {
            console.error("Table Creation Error : ", err);
          } else {
            console.log(`Table Created Successfully !!!`);
          }
        });
      }
    }
  });

  //Insert Data To Table
  const allFiles = req.files;

  for (let i = 0; i < allFiles.length; i++) {
    const insertTable = `INSERT INTO file_store (file_id, file_name, file_object, upload_date_time) 
    VALUES (?, ?, ?, ?)`;

    const file = allFiles[i];
    const file_name = file.originalname;
    const file_url = "http://localhost:5000/static/file/" + file.originalname;
    const id = uuidv4();
    const values = [id, file_name, file_url, new Date()];

    connection.query(insertTable, values, (err, result) => {
      if (err) {
        console.error("File Insert Error : ", err);
      } else {
        console.log(`Files has been uploaded successfully.`);
      }
    });
  }
  return res.send(`Successfully uploaded`);
});

//rest api to get data

app.get("/list", verifyJWT, function (req, res) {
  connection.query(
    "SELECT * FROM training.file_store",
    // "SELECT * FROM training.file_store WHERE `upload_date_time` > NOW() - INTERVAL 15 MINUTE;",
    function (err, resp, fields) {
      if (err) {
        console.error("Error : ", err);
        return;
      } else {
        if (resp == "") {
          console.log("No Data Available");
          res.send("No Data Available");
        } else {
          // console.log("DATA", resp);
          res.send(JSON.stringify(resp));
        }
      }
    }
  );
});

//rest api to delete data

app.delete("/:file_id", function (req, res) {
  let id = req.params.file_id;
  connection.query(
    `DELETE FROM training.file_store WHERE file_id=\'${id}\'`,
    (err, resp) => {
      if (err) {
        console.error("Error : ", err);
      } else {
        console.log("DELETE", resp);
        res.send("Deleted Succesfully");
      }
    }
  );
});

//LOGIN page

app.post("/register", (req, res) => {
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;

  bcryptJs.hash(password, 10).then((hash) => {
    const checkIfAlreadyExists = `SELECT * FROM training.users WHERE email=\'${email}\'`;
    
    connection.query(checkIfAlreadyExists, (err, result) => {
      console.log(result,"Register")
      if (result.length === 0) {
        connection.query(
          "INSERT INTO users (username, email, password) VALUES ( ?, ?, ?)",
          [username, email, hash],
          function (err, result) {
            if (err) {
              console.error("Error : ", err);
              return;
            } else {
              res.send({ message: "Registred Successfully" });
            }
          }
        );
      } else {
        res.send({result: "Email Already Registered" });
      }
    });
    
    
  });
});



app.get("/isUserAuth", verifyJWT, (req, res) => {
  res.send("You are Authenicated!");
});

app.post("/login", function (req, res) {
  const email = req.body.email;
  const password = req.body.password;

  if (req.body.password && req.body.email) {
    const checkIfTableExists = `SELECT * FROM training.users WHERE email=\'${email}\'`;
    connection.query(checkIfTableExists, (err, result) => {
      if (result != "") {
        const dbpassword = result[0].password;
        bcryptJs.compare(password, dbpassword).then((match) => {
          if (!match) {
            res.send({ message: "Wrong email or password" });
          } else {
            /* const accessToken = createTokens(email)
            
            res.cookie("access-token",accessToken,{
              maxAge: 60*60*24*30*1000,
              httpOnly: true,
            }) */

            const id = result[0].id;
            const token = sign({ id }, "jwtsecret", {
              expiresIn: 600,
            });
            // console.log(req, "SE");
            req = result;

            res.json({ auth: true, token: token, result: result });
            // res.send(result);
          }
        });
      } else {
        res.send({auth: false, message: "User Not Found" });
      }
    });
  } else {
    res.send({ auth: false, result: "Enter the required details" });
  }
});

app.get("/data", function (req, res) {
  connection.query(
    "SELECT * FROM training.users",
    function (err, resp, fields) {
      if (err) {
        console.error("Error : ", err);
        return;
      } else {
        if (resp == "") {
          console.log("No Data Available");
          res.send("No Data Available");
        } else {
          // console.log("DATA", resp);
          res.send(JSON.stringify(resp));
        }
      }
    }
  );
});

app.listen(5000);
