var mysql = require("mysql");
var inquirer = require("inquirer");
//var crud = require("./crud.js");

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

//set up data that is shared between functions
var Products = [];
var ProductID = [];
var ProductQTY = [];
var item, qty, leftInStock;

function readProducts() {
  //console.log("Selecting all products...\n");
  Products =[];   //reset for each query
  connection.query("SELECT * FROM inventory", function(err, res) {
    if (err) throw err;
    // Log all results of the SELECT statement
    //console.log(res);

    res.forEach(function(item){
      console.log("id: "+item.id+"   name: "+item.item_name+"   price: "+item.price+"   qty: "+item.quantity);
      Products.push({
        id: item.id,
        name: item.item_name,
        cost: parseInt(item.price),
        qty: parseInt(item.quantity)
      })
    })

    //determine parameters of purchase
    Products.map(product=>ProductID.push(product.id))
    Products.map(product=>ProductQTY.push(product.qty))

    console.log("ID array: " + ProductID + " QTY array: " + ProductQTY )

    Purchase();

  }); 
}

//this function only determines if a purchase will be made.  If not, it ends the sql connection
function Purchase(){
  inquirer
      .prompt([
        {
          type: "list",
          message: "Would you like to buy an item?",
          choices:["yes","no"],
          name:"stayOrGo"
        }
      ]).then(function(response){
        if(response.stayOrGo === "yes"){
          makePurchase();
        }
        else{
          connection.end();
        }
      })
}

//this function asks specifics about the purchase and provides a receipt before
//updating the database

function makePurchase(){
inquirer
      .prompt([
        {
          type: "input",
          message: "What is the ID of the item you would like to purchase? (choose from list)",
          name: "itemID"
        },
        {
          type: "input",
          message: "How many would you like? (between 1 & available qty)",
          name: "quantity"
        }
      ])
      .then(function(inquirerResponse) {
        // we display the inquirerResponse from the answers

        //use simplified variables to handle invalid input data
        // console.log("ID array in inq: " + ProductID + " QTY array in inq: " + ProductQTY )
        // console.log('selected id: '+inquirerResponse.itemID)

        //response has to be parsed to a number before I can check validity (next 2 variables are boolean)

        var validID = (ProductID.indexOf(parseInt(inquirerResponse.itemID)) != -1);
        //console.log('valid id? '+validID)
        var validQTY = (1< inquirerResponse.quantity && inquirerResponse.quantity < ProductQTY[inquirerResponse.itemID-1])
        //console.log('valid qty? '+validQTY)

        if(validID  && validQTY){

          //simplify quantity and id in readable variables
          qty = parseInt(inquirerResponse.quantity);
          id  = parseInt(inquirerResponse.itemID)

          leftInStock = receipt(id,qty);

          //update qty in database to reflect corrected purchase
          updateProduct(id, leftInStock);
        }
        else{
          //recursively call this routine again
          makePurchase();
        }

      });
}



function receipt(itemID, itemQuantity){
  
  console.log("\nYou have purchased " + itemQuantity);
  console.log("of: " + Products[itemID-1].name  +"\n");

  //I could add a confirmation question here before finalizing

  var total = parseInt(Products[itemID-1].cost) * itemQuantity;
  leftInStock = Products[itemID-1].qty - itemQuantity;

  if(leftInStock < 0){
    itemQuantity = adjustQuantity(Products[itemID-1].qty);
  }
  else{
    console.log("there are now "+ leftInStock +" left in stock.")
    console.log("\nYou spent $" + total +" today on your " +itemQuantity +" " +Products[itemID-1].name +".\n");
    return leftInStock;
  }

}



function updateProduct(queryID,qtyRemaining) {

  console.log("Updating product quantity...\n");
  var query = connection.query(
    "UPDATE inventory SET ? WHERE ?",
    [
      {
        quantity: qtyRemaining
      },
      {
        id: queryID
      }
    ],
    function(err, res) {
      console.log(" products updated!\n");
      // Call readProducts AFTER the UPDATE completes
      //console.log(query.sql, res.message)
    });
    readProducts();      
 }


 function createProduct() {
  console.log("Inserting a new product...\n");
  var query = connection.query(
    "INSERT INTO inventory SET ?",
    {
      item_name: "Television",
      department: "electronics",
      price: 899,
      quantity: 50
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
