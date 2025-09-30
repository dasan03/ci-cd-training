const Task = require('../../src/models/task');

describe('Task Model - Parallel Unit Tests', () => {
  const workerId = process.env.JEST_WORKER_ID || '1';
  
  describe(`Worker ${workerId} - Basic Operations`, () => {
    test('should create multiple tasks in parallel', async () => {
      const taskPromises = Array.from({ length: 10 }, (_, i) => 
        Task.create({
          title: global.testUtils.generateUniqueData(`ParallelTask${i}`),
          description: `Task created by worker ${workerId}`,
          priority: ['low', 'medium', 'high'][i % 3]
        })
      );
      
      const tasks = await Promise.all(taskPromises);
      
      expect(tasks).toHaveLength(10);
      tasks.forEach((task, i) => {
        expect(task.title).toContain(`ParallelTask${i}`);
        expect(task.title).toContain(`worker${workerId}`);
      });
    });

    test('should handle concurrent task updates', async () => {
      const task = await Task.create({
        title: global.testUtils.generateUniqueData('ConcurrentTask'),
        completed: false
      });
      
      // Simuler des mises à jour concurrentes
      const updatePromises = Array.from({ length: 5 }, (_, i) => 
        Task.findByIdAndUpdate(
          task._id,
          { description: `Updated by worker ${workerId} - attempt ${i}` },
          { new: true }
        )
      );
      
      const results = await Promise.all(updatePromises);
      
      // Vérifier qu'au moins une mise à jour a réussi
      expect(results.some(result => result !== null)).toBe(true);
    });

    test('should validate data integrity in parallel operations', async () => {
      const validationPromises = Array.from({ length: 20 }, (_, i) => {
        const isValid = i % 2 === 0;
        return Task.create({
          title: isValid ? global.testUtils.generateUniqueData(`Valid${i}`) : '', // Invalid if empty
          priority: isValid ? 'medium' : 'invalid' // Invalid priority
        }).catch(error => ({ error: error.message, index: i }));
      });
      
      const results = await Promise.all(validationPromises);
      
      const validTasks = results.filter(result => !result.error);
      const invalidTasks = results.filter(result => result.error);
      
      expect(validTasks).toHaveLength(10);
      expect(invalidTasks).toHaveLength(10);
    });
  });

  describe(`Worker ${workerId} - Performance Tests`, () => {
    test('should handle bulk operations efficiently', async () => {
      const startTime = Date.now();
      
      // Créer 100 tâches en parallèle
      const bulkTasks = Array.from({ length: 100 }, (_, i) => ({
        title: global.testUtils.generateUniqueData(`BulkTask${i}`),
        description: `Bulk task ${i} for performance testing`,
        priority: ['low', 'medium', 'high'][i % 3],
        completed: i % 4 === 0
      }));
      
      await Task.insertMany(bulkTasks);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Vérifier que l'opération est rapide (moins de 2 secondes)
      expect(duration).toBeLessThan(2000);
      
      // Vérifier que toutes les tâches ont été créées
      const count = await Task.countDocuments({ 
        title: { $regex: `worker${workerId}` } 
      });
      expect(count).toBeGreaterThanOrEqual(100);
    });

    test('should handle concurrent queries without conflicts', async () => {
      // Créer des données de test
      await global.testUtils.createIsolatedTestData(50);
      
      // Exécuter plusieurs requêtes en parallèle
      const queryPromises = [
        Task.find({ completed: true }),
        Task.find({ priority: 'high' }),
        Task.find({ tags: `worker-${workerId}` }),
        Task.countDocuments({}),
        Task.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }])
      ];
      
      const results = await Promise.all(queryPromises);
      
      expect(results[0]).toBeInstanceOf(Array); // completed tasks
      expect(results[1]).toBeInstanceOf(Array); // high priority tasks
      expect(results[2]).toBeInstanceOf(Array); // worker-specific tasks
      expect(typeof results[3]).toBe('number'); // count
      expect(results[4]).toBeInstanceOf(Array); // aggregation
    });
  });

  describe(`Worker ${workerId} - Stress Tests`, () => {
    test('should handle rapid create/delete cycles', async () => {
      const cycles = 10;
      const tasksPerCycle = 5;
      
      for (let cycle = 0; cycle < cycles; cycle++) {
        // Créer des tâches
        const createPromises = Array.from({ length: tasksPerCycle }, (_, i) =>
          Task.create({
            title: global.testUtils.generateUniqueData(`Cycle${cycle}Task${i}`),
            description: `Stress test cycle ${cycle}`
          })
        );
        
        const createdTasks = await Promise.all(createPromises);
        
        // Supprimer immédiatement
        const deletePromises = createdTasks.map(task => 
          Task.findByIdAndDelete(task._id)
        );
        
        await Promise.all(deletePromises);
        
        // Vérifier que les tâches ont été supprimées
        const remainingTasks = await Task.find({ 
          _id: { $in: createdTasks.map(t => t._id) } 
        });
        expect(remainingTasks).toHaveLength(0);
      }
    });

    test('should maintain data consistency under load', async () => {
      const initialCount = await Task.countDocuments({});
      
      // Créer de nombreuses tâches en parallèle avec différentes opérations
      const operations = [];
      
      // Opérations de création
      for (let i = 0; i < 20; i++) {
        operations.push(
          Task.create({
            title: global.testUtils.generateUniqueData(`LoadTest${i}`),
            priority: 'medium'
          })
        );
      }
      
      // Opérations de mise à jour (sur des tâches existantes)
      const existingTasks = await global.testUtils.createIsolatedTestData(10);
      for (const task of existingTasks) {
        operations.push(
          Task.findByIdAndUpdate(task._id, { 
            description: `Updated under load by worker ${workerId}` 
          })
        );
      }
      
      // Exécuter toutes les opérations en parallèle
      await Promise.all(operations);
      
      // Vérifier la cohérence des données
      const finalCount = await Task.countDocuments({});
      expect(finalCount).toBe(initialCount + 30); // 20 créées + 10 existantes
    });
  });

  describe(`Worker ${workerId} - Isolation Tests`, () => {
    test('should not interfere with other workers data', async () => {
      // Créer des données spécifiques à ce worker
      const workerTasks = await global.testUtils.createIsolatedTestData(10);
      
      // Vérifier que toutes les tâches contiennent l'ID du worker
      workerTasks.forEach(task => {
        expect(task.tags).toContain(`worker-${workerId}`);
      });
      
      // Vérifier qu'on ne peut pas voir les données d'autres workers
      const otherWorkerTasks = await Task.find({
        tags: { $not: { $in: [`worker-${workerId}`] } }
      });
      
      // Dans un environnement de test isolé, il ne devrait pas y avoir d'autres données
      expect(otherWorkerTasks).toHaveLength(0);
    });

    test('should handle database locks gracefully', async () => {
      const task = await Task.create({
        title: global.testUtils.generateUniqueData('LockTest'),
        completed: false
      });
      
      // Simuler des accès concurrents au même document
      const concurrentUpdates = Array.from({ length: 10 }, (_, i) =>
        Task.findByIdAndUpdate(
          task._id,
          { 
            description: `Lock test update ${i} by worker ${workerId}`,
            updatedAt: new Date()
          },
          { new: true }
        ).catch(error => ({ error: error.message }))
      );
      
      const results = await Promise.all(concurrentUpdates);
      
      // Au moins une mise à jour devrait réussir
      const successfulUpdates = results.filter(result => !result.error);
      expect(successfulUpdates.length).toBeGreaterThan(0);
      
      // Vérifier l'état final du document
      const finalTask = await Task.findById(task._id);
      expect(finalTask).toBeTruthy();
      expect(finalTask.description).toContain(`worker ${workerId}`);
    });
  });
});