var db = require('../config/connection')
var collection = require('../config/collections')

module.exports = {

  addProduct: (product, callback) => {
    db.get().collection('product').insertOne(product).then((data) => {
      callback(data.insertedId)
    })


  },
  getAllProducts:()=>{
    return new Promise(async(resolve,reject)=>{
      let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
      resolve(products)
    })
  }

}

/*
const express = require('express');
const router = express.Router();
const db = require('../config/connection'); // path to your connection file

router.get('/add-product', (req, res) => {
  const product = req.body; // the data from your form

  db.get().collection('products').insertOne(product)
    .then((data) => {
      console.log(" Product added successfully!");
      res.redirect('/admin/add-product');
    })
    .catch((err) => {
      console.error("Error adding product:", err);
      res.status(500).send("Failed to add product");
    });
});

module.exports = router; */