var inquirer = require("inquirer");
var mysql = require("mysql");
var cTable = require("console.table")

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
    console.table(res);

    // console.log(" product ID       product name           price             available");
    // console.log("----------------------------------------------------------------------");
    // res.forEach(function(item){

    // //numerical values need to be strings to determine length
    //   var dispID = item.id.toString();

    //   if(dispID.length<3){
    //     for(n=dispID.length;n<3;n++){
    //       dispID+=" ";
    //     }
    //   }

    //   if(item.item_name.length<20){
    //     for(j=item.item_name.length;j<20;j++){
    //       item.item_name+=" ";
    //     }
    //   }

    //   //numerical values need to be strings to determine length
    //   var dispPrice = item.price.toString();

    //   if(dispPrice.length<10){
    //     for(k=dispPrice.length;k<10;k++){
    //       dispPrice+=" ";
    //     }
    //   }
    //   console.log("id: "+dispID+" |   name: "+item.item_name+" |  price: "+dispPrice+" |  qty: "+item.quantity);
    res.forEach(function(item){

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

    //console.log("ID array: " + ProductID + " QTY array: " + ProductQTY )

    Options();

  }); 
}

//this function determines the course of action to take next
function Options(){
  inquirer
      .prompt([
        {
          type: "list",
          message: "Are you ...",
          choices:["...a customer?","...a manager?","...done?"],
          name:"whatToDo"
        }
      ]).then(function(response){
        if(response.whatToDo === "...a customer?"){
          makePurchase();
        }
        else if(response.whatToDo === "...a manager?"){
          manageStuff();
        }
        else{
          console.log("Have a nice day!");
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
        var validQTY = (0< inquirerResponse.quantity && inquirerResponse.quantity < ProductQTY[inquirerResponse.itemID-1])
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
          console.log(" you entered an invalid value for the id or quantity ...")
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

  //console.log("there are now "+ leftInStock +" left in stock.")
  console.log("\nYou spent $" + total +" today on your " +itemQuantity +" " +Products[itemID-1].name +".\n");
  return leftInStock;

}


function updateProduct(queryID,newQTY) {

  console.log("Updating product quantity...\n");
  var query = connection.query(
    "UPDATE inventory SET ? WHERE ?",
    [
      {
        quantity: newQTY
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

 function manageStuff(){
  inquirer
    .prompt([
      {
        type: "list",
        message: "What would you like to do?",
        choices:["Add a new product","Restock an existing product","Delete a product line"],
        name: "manage"
      }
    ]).then(function(response){
      if(response.manage==="Add a new product"){
        inquirer
        .prompt([
          {
            type: "input",
            message: "What is the item you would like to add?",
            name: "item"
          },
          {
            type: "input",
            message: "What is the department for this product?",
            name: "dept"
          },
          {
            type: "input",
            message: "What is the item cost?",
            name: "price"
          },
          {
            type: "input",
            message: "How many of the item will be added to stock?",
            name: "qty"
          }
        ]).then(function(response){
          createProduct(response.item,response.dept,response.price,response.qty);
        });
      }
      else if(response.manage==="Restock an existing product"){
        inquirer
          .prompt([
            {
              type:"input",
              message: "Enter the product id: ",
              name: "productID"
            },
            {
              type:"input",
              message: "How many are you adding to current stock?",
              name: "qtyToAdd"
            }
          ]).then(function(response){
            updatedQTY = Products[response.productID-1].qty + parseInt(response.qtyToAdd);
            updateProduct(response.productID,updatedQTY);
          })
      }
      else if(response.manage==="Delete a product line"){
        inquirer
          .prompt([
            {
              type:"input",
              message: "Enter the ID of the product to delete:  ",
              name: "productID"
            },
            {
              type:"confirm",
              message:"Are you sure? You are entering the Red Zone...",
              name:"confirm"
            }
          ]).then(function(response){
            deleteProduct(response.productID);
          })
      }
    })
}


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
          // logs the actual query being run
          console.log(query.sql);
        }
      );
      readProducts();
  };





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
