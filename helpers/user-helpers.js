const db = require('../config/connection');
const bcrypt = require('bcrypt');
const collection = require('../config/collections');
const { response, use, resource } = require('../app');
var objectid = require('mongodb').ObjectId
const Razorpay = require('razorpay')
var instance = new Razorpay({ key_id: 'rzp_test_RYqHM2J0hEBZCJ', key_secret: 'vfbc34tn8oPdtgCEfV0A2pED' })


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
          db.get().collection(collection.CART_COLLECTION).updateOne({ user: new objectid(userId), 'products.item': new objectid(proId) },
            {
              $inc: { 'products.$.quantity': 1 }
            }
          ).then(() => {
            resolve()
          })

        } else {
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
          $unwind: '$products'
        },
        {
          $project: {
            item: '$products.item',
            quantity: '$products.quantity'
          }
        },
        {
          $lookup: {
            from: collection.PRODUCT_COLLECTION,
            localField: 'item',
            foreignField: '_id',
            as: 'product'
          }
        }, {
          $project: {
            item: 1,
            quantity: 1,
            product: { $arrayElemAt: ['$product', 0] }
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
      else {
        count = 0
      }
      resolve(count)
    })
  }, changeProductQuantity: (details) => {
    details.count = parseInt(details.count)
    details.quantity = parseInt(details.quantity)

    return new Promise((resolve, reject) => {
      console.log(details)
      if (details.count == -1 && details.quantity == 1) {
        db.get().collection(collection.CART_COLLECTION).updateOne(
          { _id: new objectid(details.cart) },
          { $pull: { products: { item: new objectid(details.product) } } }

        ).then(() => {
          resolve({ removeProduct: true })
        })
      } else {
        db.get().collection(collection.CART_COLLECTION).updateOne(
          { _id: new objectid(details.cart), 'products.item': new objectid(details.product) },
          { $inc: { 'products.$.quantity': details.count } }
        ).then(() => {
          resolve({ removeProduct: false })
        })
      }
    })
  }, removeProduct: (details) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.CART_COLLECTION)
        .updateOne(
          { _id: new objectid(details.cart) },
          { $pull: { products: { item: new objectid(details.product) } } }
        )
        .then(() => resolve())
        .catch(reject);
    });
  },
  getTotalAmount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
        { $match: { user: new objectid(userId) } },
        { $unwind: '$products' },
        {
          $project: {
            item: '$products.item',
            quantity: '$products.quantity',
          }
        },
        {
          $lookup: {
            from: collection.PRODUCT_COLLECTION,
            localField: 'item',
            foreignField: '_id',
            as: 'product'
          }
        },
        {
          $project: {
            item: 1,
            quantity: 1,
            product: { $arrayElemAt: ['$product', 0] },
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $multiply: ['$quantity', { $toDouble: '$product.Price' }] } }
          }
        }
      ]).toArray()
      if (total.length > 0) {
        resolve(total[0].total)
      } else {
        resolve(0)
      }
    })
  },
  placeOrder: (orderData, products, total) => {
    return new Promise((resolve, reject) => {
      let status = orderData['paymentMethod'] === 'cod' ? 'placed' : 'pending'
      let orderObj = {
        deliveryDetails: {
          address: orderData.address,
          phone: orderData.phone,
          pincode: orderData.pincode
        },
        userId: new objectid(orderData.userId),
        paymentMethod: orderData.paymentMethod,
        products: products,
        totalAmount: total,
        status: status,
        date: new Date()
      }

      db.get().collection(collection.ORDER_COLLECTION)
        .insertOne(orderObj)
        .then((response) => {
          resolve(response.insertedId)
        })
    })
  },
  deleteCart: (userId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.CART_COLLECTION)
        .deleteOne({ user: new objectid(userId) })
        .then(() => resolve())
    })
  }, getUserOrders: (userId) => {
    return new Promise(async (resolve, reject) => {
      let orders = await db.get().collection(collection.ORDER_COLLECTION)
        .find({ userId: new objectid(userId) })
        .sort({ _id: -1 })
        .toArray()
      resolve(orders)
    })
  },
  getOrderDetails: (orderId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let order = await db.get().collection(collection.ORDER_COLLECTION)
          .findOne({ _id: new objectid(orderId) });
        resolve(order);
      } catch (err) {
        reject(err);
      }
    });
  },
  generateRazorPay: (orderId,total) => {
    return new  Promise((resolve,reject)=>{
    var options = {
      amount: total * 100,  // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
      currency: "INR",
      receipt: orderId
    };
    instance.orders.create(options, function (err, order) {
      console.log("New order :",order);
      resolve(order)
    });
  })
  }



}





