const db = require('../config/connection');
const bcrypt = require('bcrypt');
const collection = require('../config/collections');

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
            response.user=user
            response.status=true
            resolve(response)
          } else {
            console.log('Login Failed')
            resolve({status:false})
          }

        })
      } else {
        console.log('User not found')
        resolve({status:false})

      }
    })
  }
};
