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

module.exports.createProduct = createProduct;
module.exports.deleteProduct = deleteProduct;