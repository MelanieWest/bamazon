var mysql = require("mysql");

var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,

  // Your username
  user: "root",

  // Your password
  password: "",
  database: "bamazon_db"
});

connection.connect(function(err) {
  if (err) throw err;
  console.log("connected as id " + connection.threadId + "\n");
  readProducts();
});

function createProduct(item,dept,price,qty) {
    console.log("Inserting a new product...\n");
    var query = connection.query(
      "INSERT INTO inventory SET ?",
      {
        item_name: item,
        department: dept,
        price: price,
        quantity: qty
      },
      function(err, res) {
        console.log(" product inserted!\n");
        // Call readProducts AFTER the INSERT completes
        readProducts();
      }
    );
  
    // logs the actual query being run
    console.log(query.sql);
  }
  


function deleteProduct(queryID) {
    console.log("Deleting the product line ...\n");
    connection.query(
      "DELETE FROM inventory WHERE ?",
      {
        id: queryID
      },
      function(err, res) {
        console.log(" products deleted!\n");
        // Call readProducts AFTER the DELETE completes
        readProducts();
      }
    );
}

module.exports.crud = crud;