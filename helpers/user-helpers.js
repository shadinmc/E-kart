const db = require('../config/connection');
const bcrypt = require('bcrypt');
const collection = require('../config/collections');
const { response, use } = require('../app');
var objectid = require('mongodb').ObjectId

module.exports = {
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      try {
        userData.Password = await bcrypt.hash(userData.Password, 10);
        const data = await db.get().collection(collection.USER_COLLECTION).insertOne(userData);
        resolve(data.insertedId);

      } catch (err) {
        console.error("Error during signup:", err);
        reject(err);
      }
    });
  },
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false
      let response = {}
      let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email })
      if (user) {
        bcrypt.compare(userData.Password, user.Password).then((status) => {
          if (status) {
            console.log('Login success')
            response.user = user
            response.status = true
            resolve(response)
          } else {
            console.log('Login Failed')
            resolve({ status: false })
          }

        })
      } else {
        console.log('User not found')
        resolve({ status: false })

      }
    })
  },
  addToCart: (proId, userId) => {
    let proObj = {
      item: new objectid(proId),
      quantity: 1
    }
    return new Promise(async (resolve, reject) => {
      let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: new objectid(userId) })
      if (userCart) {
        let proExist = userCart.products.findIndex(product => product.item == proId)
        console.log(proExist)
        if (proExist != -1) {
          db.get().collection(collection.CART_COLLECTION).updateOne({ user:new objectid(userId),'products.item': new objectid(proId) },
            {
              $inc: { 'products.$.quantity': 1 }
            }
          ).then(() => {
            resolve()
          })

        }else{
        db.get().collection(collection.CART_COLLECTION).updateOne({ user: new objectid(userId) },
          {
            $push: { products: proObj }
          }
        ).then((response) => {
          resolve()
        })
      }
      } else {
        let cartObj = {
          user: new objectid(userId),
          products: [proObj]
        }
        db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
          resolve()
        })
      }
    })
  },
  getCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
        {
          $match: { user: new objectid(userId) }
        },
        {
          $unwind:'$products'
        },
        {
          $project:{
            item:'$products.item',
            quantity:'$products.quantity'
          }
        },
        {
          $lookup:{
            from:collection.PRODUCT_COLLECTION,
            localField:'item',
            foreignField:'_id',
            as:'product'
          }
        },{
        $project:{
          item:1,
          quantity:1,
          product:{$arrayElemAt:['$product',0]}
        }
      }
      ]).toArray()
      resolve(cartItems)
    })
  },
  getCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: new objectid(userId) })
      if (cart) {
        count = cart.products.length
      }
      else{
        count = 0 
      }
      resolve(count)
    })
  }, changeProductQuantity:(details) => {
    count=parseInt(details.count)
    console.log(details.cart)
    return new Promise((resolve,reject)=>{
      db.get().collection(collection.CART_COLLECTION).updateOne({_id:new objectid(details.cart), 'products.item':new objectid(details.product)},
      {
        $inc:{'products.$.quantity':count}
      }
    ).then(()=>{
      resolve()
    })
    })
    
  },

  removeProduct: (details) => {
  return new Promise((resolve, reject) => {
    db.get().collection(collection.CART_COLLECTION)
      .updateOne(
        { _id: new objectid(details.cart) },
        { $pull: { products: { item: new objectid(details.product) } } }
      )
      .then(() => resolve())
      .catch(reject);
  });
}



};


