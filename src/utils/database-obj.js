const mysql = require('mysql');

const dbObj = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "password",
    database: "hackathon",
    port: "7400"
});

dbObj.connect((err)=>{
    if(err) throw err;
    console.log("MySQL Connected");
})

module.exports = dbObj;