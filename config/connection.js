const { MongoClient } = require('mongodb');

const state = {
     db: null
};

module.exports.connect = function (done) {
     const url = 'mongodb://localhost:27017';
     const dbName = 'shopping'; // your database name

     MongoClient.connect(url)
          .then((client) => {
               state.db = client.db(dbName);
               console.log("MongoDB Connected Successfully!");
               done();
          })
          .catch((err) => {
               console.log("MongoDB Connection Failed!", err);
               done(err);
          });
};

module.exports.get = function () {
     return state.db;
};