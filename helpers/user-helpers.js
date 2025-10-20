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
  }
};
