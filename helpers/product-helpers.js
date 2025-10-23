var db = require('../config/connection')
var collection = require('../config/collections')
var objectid = require('mongodb').ObjectId

module.exports = {

  addProduct: (product, callback) => {
    db.get().collection('product').insertOne(product).then((data) => {
      callback(data.insertedId)
    })


  },
  getAllProducts: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
      resolve(products)
    })
  },
  deleteProduct: (prodId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({ _id: new objectid(prodId) }).then((response) => {
        resolve(response);
      }).catch((error) => {
        reject(error);
      });
    });
  },
  getProductDetails:(prodId)=>{
    return new Promise((resolve,reject)=>{
      db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:new objectid(prodId)}).then((product)=>{
        resolve(product)
      })
    })
  },
  updateProduct:(prodId,proDetails)=>{
    return new Promise((resolve,reject)=>{
      db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:new objectid(prodId)},{
      $set:{Name:proDetails.Name,
      Description:proDetails.Description,
      Price:proDetails.Price,
      Category:proDetails.Category
    }
  }).then((response)=>{
    resolve()
      })
    })
  }
}
