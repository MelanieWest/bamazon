DROP DATABASE IF EXISTS bamazon_db;
CREATE DATABASE bamazon_db;

USE bamazon_db;

CREATE TABLE inventory(
  id INT NOT NULL AUTO_INCREMENT,
  item_name VARCHAR(100) NOT NULL,
  department VARCHAR(45) NOT NULL,
  price INT(10.2) default 0,
  quantity INT default 0,
  PRIMARY KEY (id)
);