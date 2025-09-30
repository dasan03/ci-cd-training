const request = require('supertest');
const app = require('../../src/app');
const Task = require('../../src/models/task');

// Configuration pour les tests de charge
process.env.NODE_ENV = 'test';
process.env.TEST_TYPE = 'integration';

describe('Load Testing - Parallel Execution', () => {
  const workerId = process.env.JEST_WORKER_ID || '1';
  
  beforeEach(async () => {
    // Créer des données de base pour les tests de charge
    await global.testUtils.createIsolatedTestData(100);
  });

  describe(`Worker ${workerId} - API Load Tests`, () => {
    test('should handle concurrent GET requests', async () => {
      const concurrentRequests = 20;
      const startTime = Date.now();
      
      const requests = Array.from({ length: concurrentRequests }, () =>
        request(app)
          .get('/api/tasks')
          .expect(200)
      );
      
      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Vérifier que toutes les requêtes ont réussi
      responses.forEach(response => {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
      });
      
      // Vérifier les performances (moins de 5 secondes pour 20 requêtes)
      expect(duration).toBeLessThan(5000);
      
      console.log(`Worker ${workerId}: ${concurrentRequests} GET requests completed in ${duration}ms`);
    });

    test('should handle concurrent POST requests', async () => {
      const concurrentPosts = 15;
      const startTime = Date.now();
      
      const postRequests = Array.from({ length: concurrentPosts }, (_, i) =>
        request(app)
          .post('/api/tasks')
          .send({
            title: global.testUtils.generateUniqueData(`LoadPost${i}`),
            description: `Load test POST ${i} by worker ${workerId}`,
            priority: ['low', 'medium', 'high'][i % 3]
          })
          .expect(201)
      );
      
      const responses = await Promise.all(postRequests);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Vérifier que toutes les créations ont réussi
      responses.forEach((response, i) => {
        expect(response.body.success).toBe(true);
        expect(response.body.data.title).toContain(`LoadPost${i}`);
      });
      
      // Vérifier que les tâches ont été créées en base
      const createdTasks = await Task.find({
        title: { $regex: `LoadPost.*worker${workerId}` }
      });
      expect(createdTasks).toHaveLength(concurrentPosts);
      
      console.log(`Worker ${workerId}: ${concurrentPosts} POST requests completed in ${duration}ms`);
    });

    test('should handle mixed concurrent operations', async () => {
      const operationsCount = 30;
      const startTime = Date.now();
      
      // Créer quelques tâches pour les opérations de lecture/mise à jour
      const existingTasks = await global.testUtils.createIsolatedTestData(10);
      
      const mixedOperations = [];
      
      for (let i = 0; i < operationsCount; i++) {
        const operation = i % 4;
        
        switch (operation) {
          case 0: // GET all tasks
            mixedOperations.push(
              request(app).get('/api/tasks').expect(200)
            );
            break;
            
          case 1: // POST new task
            mixedOperations.push(
              request(app)
                .post('/api/tasks')
                .send({
                  title: global.testUtils.generateUniqueData(`Mixed${i}`),
                  priority: 'medium'
                })
                .expect(201)
            );
            break;
            
          case 2: // GET specific task
            const randomTask = existingTasks[i % existingTasks.length];
            mixedOperations.push(
              request(app)
                .get(`/api/tasks/${randomTask._id}`)
                .expect(200)
            );
            break;
            
          case 3: // PUT update task
            const taskToUpdate = existingTasks[i % existingTasks.length];
            mixedOperations.push(
              request(app)
                .put(`/api/tasks/${taskToUpdate._id}`)
                .send({
                  description: `Updated by load test worker ${workerId}`
                })
                .expect(200)
            );
            break;
        }
      }
      
      const results = await Promise.all(mixedOperations);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Vérifier que toutes les opérations ont réussi
      results.forEach(result => {
        expect([200, 201]).toContain(result.status);
      });
      
      console.log(`Worker ${workerId}: ${operationsCount} mixed operations completed in ${duration}ms`);
    });
  });

  describe(`Worker ${workerId} - Database Load Tests`, () => {
    test('should handle bulk database operations', async () => {
      const bulkSize = 200;
      const startTime = Date.now();
      
      // Test d'insertion en masse
      const bulkTasks = Array.from({ length: bulkSize }, (_, i) => ({
        title: global.testUtils.generateUniqueData(`Bulk${i}`),
        description: `Bulk operation test ${i}`,
        priority: ['low', 'medium', 'high'][i % 3],
        completed: i % 3 === 0,
        tags: [`bulk-test`, `worker-${workerId}`]
      }));
      
      await Task.insertMany(bulkTasks);
      
      const insertTime = Date.now();
      console.log(`Worker ${workerId}: Bulk insert of ${bulkSize} tasks: ${insertTime - startTime}ms`);
      
      // Test de requête en masse
      const queryResults = await Promise.all([
        Task.find({ tags: `worker-${workerId}` }),
        Task.countDocuments({ completed: true }),
        Task.aggregate([
          { $match: { tags: `worker-${workerId}` } },
          { $group: { _id: '$priority', count: { $sum: 1 } } }
        ])
      ]);
      
      const queryTime = Date.now();
      console.log(`Worker ${workerId}: Bulk queries completed: ${queryTime - insertTime}ms`);
      
      // Vérifications
      expect(queryResults[0].length).toBeGreaterThanOrEqual(bulkSize);
      expect(typeof queryResults[1]).toBe('number');
      expect(queryResults[2]).toBeInstanceOf(Array);
      
      const totalTime = queryTime - startTime;
      expect(totalTime).toBeLessThan(10000); // Moins de 10 secondes
    });

    test('should maintain performance under concurrent database stress', async () => {
      const stressOperations = [];
      const operationCount = 50;
      
      // Créer différents types d'opérations de base de données
      for (let i = 0; i < operationCount; i++) {
        const opType = i % 5;
        
        switch (opType) {
          case 0: // Create
            stressOperations.push(
              Task.create({
                title: global.testUtils.generateUniqueData(`Stress${i}`),
                priority: 'medium'
              })
            );
            break;
            
          case 1: // Find
            stressOperations.push(
              Task.find({ priority: 'medium' }).limit(10)
            );
            break;
            
          case 2: // Count
            stressOperations.push(
              Task.countDocuments({ completed: false })
            );
            break;
            
          case 3: // Aggregate
            stressOperations.push(
              Task.aggregate([
                { $group: { _id: '$completed', count: { $sum: 1 } } }
              ])
            );
            break;
            
          case 4: // Update
            stressOperations.push(
              Task.updateMany(
                { tags: `worker-${workerId}` },
                { $set: { updatedAt: new Date() } }
              )
            );
            break;
        }
      }
      
      const startTime = Date.now();
      const results = await Promise.all(stressOperations);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Vérifier que toutes les opérations ont réussi
      expect(results).toHaveLength(operationCount);
      
      // Performance acceptable (moins de 15 secondes pour 50 opérations)
      expect(duration).toBeLessThan(15000);
      
      console.log(`Worker ${workerId}: ${operationCount} database stress operations: ${duration}ms`);
    });
  });

  describe(`Worker ${workerId} - Memory and Resource Tests`, () => {
    test('should handle large result sets efficiently', async () => {
      // Créer un grand nombre de tâches
      const largeDataSet = Array.from({ length: 1000 }, (_, i) => ({
        title: global.testUtils.generateUniqueData(`Large${i}`),
        description: `Large dataset test ${i}`.repeat(10), // Description plus longue
        priority: ['low', 'medium', 'high'][i % 3],
        tags: Array.from({ length: 5 }, (_, j) => `tag${j}-${i}`)
      }));
      
      await Task.insertMany(largeDataSet);
      
      const startTime = Date.now();
      
      // Requêtes sur de gros volumes de données
      const largeQueries = await Promise.all([
        Task.find({ tags: { $regex: `worker-${workerId}` } }),
        Task.find({}).sort({ createdAt: -1 }).limit(500),
        Task.aggregate([
          { $match: { tags: { $regex: `worker-${workerId}` } } },
          { $group: { _id: '$priority', tasks: { $push: '$title' } } }
        ])
      ]);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Vérifier que les requêtes retournent des résultats
      expect(largeQueries[0].length).toBeGreaterThan(0);
      expect(largeQueries[1].length).toBeGreaterThan(0);
      expect(largeQueries[2].length).toBeGreaterThan(0);
      
      // Performance acceptable pour de gros volumes
      expect(duration).toBeLessThan(5000);
      
      console.log(`Worker ${workerId}: Large dataset queries: ${duration}ms`);
    });

    test('should cleanup resources properly', async () => {
      const initialMemory = process.memoryUsage();
      
      // Créer et supprimer de nombreuses tâches
      for (let cycle = 0; cycle < 10; cycle++) {
        const tasks = await Task.insertMany(
          Array.from({ length: 100 }, (_, i) => ({
            title: global.testUtils.generateUniqueData(`Cleanup${cycle}${i}`),
            description: 'Temporary task for cleanup test'
          }))
        );
        
        await Task.deleteMany({
          _id: { $in: tasks.map(t => t._id) }
        });
      }
      
      // Forcer le garbage collection si disponible
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage();
      
      // Vérifier que la mémoire n'a pas explosé
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreasePercent = (memoryIncrease / initialMemory.heapUsed) * 100;
      
      console.log(`Worker ${workerId}: Memory increase: ${memoryIncreasePercent.toFixed(2)}%`);
      
      // La mémoire ne devrait pas augmenter de plus de 50%
      expect(memoryIncreasePercent).toBeLessThan(50);
    });
  });
});