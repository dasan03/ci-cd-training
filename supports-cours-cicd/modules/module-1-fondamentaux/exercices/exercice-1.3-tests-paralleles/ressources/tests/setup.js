const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { v4: uuidv4 } = require('uuid');

let mongoServer;
let testDbName;

// Configuration spécifique pour les tests parallèles
beforeAll(async () => {
  // Générer un nom de base de données unique pour chaque worker
  const workerId = process.env.JEST_WORKER_ID || '1';
  testDbName = `todoapp_test_${workerId}_${uuidv4().substring(0, 8)}`;
  
  if (process.env.TEST_TYPE !== 'integration') {
    // Tests unitaires : MongoDB Memory Server avec port unique
    mongoServer = await MongoMemoryServer.create({
      instance: {
        port: 27017 + parseInt(workerId),
        dbName: testDbName
      }
    });
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  } else {
    // Tests d'intégration : MongoDB réel avec base de données unique
    const baseUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const mongoUri = `${baseUri}/${testDbName}`;
    await mongoose.connect(mongoUri);
  }
  
  console.log(`Worker ${workerId} connected to database: ${testDbName}`);
});

// Nettoyage après chaque test pour éviter les interférences
afterEach(async () => {
  if (mongoose.connection.db) {
    const collections = await mongoose.connection.db.collections();
    
    // Nettoyage parallèle des collections
    await Promise.all(
      collections.map(collection => collection.deleteMany({}))
    );
  }
});

// Nettoyage complet après tous les tests
afterAll(async () => {
  if (mongoose.connection.db) {
    // Supprimer complètement la base de données de test
    await mongoose.connection.db.dropDatabase();
  }
  
  await mongoose.connection.close();
  
  if (mongoServer) {
    await mongoServer.stop();
  }
  
  console.log(`Worker ${process.env.JEST_WORKER_ID || '1'} cleanup completed`);
});

// Configuration des timeouts pour les tests parallèles
jest.setTimeout(45000);

// Utilitaires pour les tests parallèles
global.testUtils = {
  // Générer des données de test uniques
  generateUniqueData: (prefix = 'test') => {
    const workerId = process.env.JEST_WORKER_ID || '1';
    const timestamp = Date.now();
    return `${prefix}_worker${workerId}_${timestamp}`;
  },
  
  // Attendre que les opérations asynchrones se terminent
  waitForAsync: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Créer des données de test isolées
  createIsolatedTestData: async (count = 5) => {
    const Task = require('../src/models/task');
    const workerId = process.env.JEST_WORKER_ID || '1';
    
    const tasks = [];
    for (let i = 0; i < count; i++) {
      tasks.push({
        title: `Task ${i} - Worker ${workerId} - ${Date.now()}`,
        description: `Test task for worker ${workerId}`,
        priority: ['low', 'medium', 'high'][i % 3],
        completed: i % 2 === 0,
        tags: [`worker-${workerId}`, `test-${i}`]
      });
    }
    
    return await Task.create(tasks);
  },
  
  // Nettoyer les données de test spécifiques
  cleanupTestData: async (pattern) => {
    const Task = require('../src/models/task');
    await Task.deleteMany({ title: { $regex: pattern } });
  }
};

// Gestion des erreurs non capturées dans les tests parallèles
process.on('unhandledRejection', (reason, promise) => {
  console.error(`Unhandled Rejection in worker ${process.env.JEST_WORKER_ID}:`, reason);
});

process.on('uncaughtException', (error) => {
  console.error(`Uncaught Exception in worker ${process.env.JEST_WORKER_ID}:`, error);
});