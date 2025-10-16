const { MongoClient } = require('mongodb');

async function testConnection() {
  try {
    const url = 'mongodb://localhost:27017';
    const client = new MongoClient(url);
    await client.connect();
    console.log('Connected to MongoDB');
    await client.close();
  } catch (err) {
    console.error('MongoDB error:', err);
  }
}

testConnection();