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
    ProductID = Products.map(product=>product.id)
    ProductQTY = Products.map(product=>product.qty)
    console.log("ID array: " + ProductID + " QTY array: " + ProductQTY )
    Purchase(ProductID,ProductQTY);

  }); 
}

//this function only determines if a purchase will be made.  If not, it ends the sql connection
function Purchase(ID,QTY){
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
          makePurchase(ID,QTY);
        }
        else{
          connection.end();
        }
      })
}

//this function asks specifics about the purchase and provides a receipt before
//updating the database

function makePurchase(ID,QTY){
inquirer
      .prompt([
        {
          type: "input",
          message: "What is the ID of the item you would like to purchase?",
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

        var validID = (ID.indexOf(inquirerResponse.itemID)!=-1);
        var validQTY = (1< inquirerResponse.quantity && inquirerResponse.quantity < QTY[inquirerResponse.itemID-1])

        if(!validID || !validQTY){
          needMoreInfo();
        }
        else{

          //simplify quantity and id in readable variables
          qty = parseInt(inquirerResponse.quantity);
          id  = parseInt(inquirerResponse.itemID)

          leftInStock = receipt(id,qty);

          //update qty in database to reflect corrected purchase
          updateProduct(id, leftInStock);
        }

      });
}


//call this function in response to incomplete input info

function needMoreInfo(){
  console.log("Please enter both a valid id and a quantity in range: ")
  inquirer
      .prompt([
        {
          type: "input",
          message: "Please select the id of the item you would like to purchase",
          name:"itemID" 
        },
        {
          type: "input",
          message: "Please select the quantity of the item you would like to purchase (between 1 and available qty)",
          name:"quantity" 
        }
      ]).then(function(response){

        //simplify id and quantity into readable variables
        id = parseInt(response.itemID);
        qty = parseInt(response.quantity);

        leftInStock = receipt(id,qty);

        //update qty in database to reflect corrected purchase
        updateProduct(id, leftInStock);

        // console.log("\nYou have purchased " + qty);
        // console.log("of: " + Products[item-1].name  +"\n");
        // var total = parseInt(Products[item-1].cost) * qty;
        // leftInStock = Products[item-1].qty - qty;
      
        // if(leftInStock < 0){
        //   var qty = adjustQuantity(Products[item-1].qty);
        // }
        // else{
        //   console.log("there are now "+ leftInStock +" left in stock.")
      
        //   if(inquirerResponse.receipt === "Yes, please") {
        //     console.log("\nYou spent $" + total +" today on your " +qty +" " +Products[item-1].name +".\n");
        //   }
        // }

      })
}

function receipt(itemID, itemQuantity){
  console.log("\nYou have purchased " + itemQuantity);
  console.log("of: " + Products[itemID-1].name  +"\n");
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

//call this function in case someone tries to buy more than we have in stock
// ('available' is the amount in stock)

function adjustQuantity(available){
  inquirer
      .prompt([
        {
          type: "input",
          message: "there are only "+available+" items available. Please enter a new quantity (enter '0' if you changed your mind):",
          name:"newQty" 
        }
      ]).then(function(response){
        var adjusted = parseInt(response.newQty)
        if( adjusted > 0 && adjusted <= available){
            console.log('adjusted = '+ adjusted);
            return adjusted;
        }
        else{
          console.log("We are sorry we couldn't help you with this item.");
          //allow them to select something different, or exit
          Purchase();
        }
      })
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
