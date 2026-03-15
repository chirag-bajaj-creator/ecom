// Set test environment BEFORE importing app
process.env.NODE_ENV = 'test';

const mongoose = require('mongoose');
const app = require('../app');

const TEST_DB_URI = 'mongodb://localhost:27017/ecommerce_test';

// Connect to test database before all tests
const connectTestDB = async () => {
  await mongoose.connect(TEST_DB_URI);
};

// Clear all collections after each test suite
const clearTestDB = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

// Disconnect after all tests
const disconnectTestDB = async () => {
  await clearTestDB();
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
};

module.exports = {
  app,
  connectTestDB,
  clearTestDB,
  disconnectTestDB,
};
