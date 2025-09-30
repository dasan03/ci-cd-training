const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Setup before all tests
beforeAll(async () => {
  // Use MongoDB Memory Server for unit tests, real MongoDB for integration tests
  if (process.env.TEST_TYPE !== 'integration') {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  } else {
    // For integration tests, use the MongoDB from Docker Compose
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/todoapp_test';
    await mongoose.connect(mongoUri);
  }
});

// Cleanup after each test
afterEach(async () => {
  if (mongoose.connection.db) {
    const collections = await mongoose.connection.db.collections();
    for (let collection of collections) {
      await collection.deleteMany({});
    }
  }
});

// Cleanup after all tests
afterAll(async () => {
  await mongoose.connection.close();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

// Increase timeout for database operations
jest.setTimeout(30000);