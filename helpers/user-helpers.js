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
    return new Promise(async (resolve, reject) => {
      let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: new objectid(userId) })
      if (userCart) {
        db.get().collection(collection.CART_COLLECTION).updateOne({ user: new objectid(userId) }, {
          $push: { products: new objectid(proId) }
        }
        ).then((response) => {
          resolve()
        })
      } else {
        let cartObj = {
          user: new objectid(userId),
          products: [new objectid(proId)]
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
          $lookup: {
            from: collection.PRODUCT_COLLECTION,
            let: { prodList: '$products' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ['$_id', "$$prodList"]
                  }
                }
              }
            ],
            as: 'cartItems'
          }
        }
      ]).toArray()
      resolve(cartItems[0].cartItems)
    })
  },
  getCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: new objectid(userId) })
      if (cart) {
        count = cart.products.length
      }
      resolve(count)
    })
  }, changeProductQuantity: async (userId, productId, count) => {
    const cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: new objectid(userId) });

    const product = cart.products.find(p => p.item.equals(new objectid(productId)));
    const newQty = product.quantity + count;

    if (newQty <= 0) {
      await db.get().collection(collection.CART_COLLECTION).updateOne(
        { user: new objectid(userId) },
        { $pull: { products: { item: new objectid(productId) } } }
      );
      return { removeProduct: true };
    } else {
      await db.get().collection(collection.CART_COLLECTION).updateOne(
        { user: new objectid(userId), 'products.item': new objectid(productId) },
        { $inc: { 'products.$.quantity': count } }
      );
      return { removeProduct: false };
    }
  },

  removeProductFromCart: async (userId, productId) => {
    await db.get().collection(collection.CART_COLLECTION).updateOne(
      { user: new objectid(userId) },
      { $pull: { products: { item: new objectid(productId) } } }
    );
  },


};


