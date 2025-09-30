const request = require('supertest');
const app = require('../../src/app');
const Task = require('../../src/models/task');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.TEST_TYPE = 'integration';

describe('Task API Integration Tests', () => {
  describe('GET /health', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body.status).toBe('OK');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.environment).toBe('test');
    });
  });

  describe('POST /api/tasks', () => {
    test('should create a new task', async () => {
      const taskData = {
        title: 'Integration Test Task',
        description: 'This is a test task for integration testing',
        priority: 'high',
        tags: ['test', 'integration']
      };
      
      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(taskData.title);
      expect(response.body.data.description).toBe(taskData.description);
      expect(response.body.data.priority).toBe(taskData.priority);
      expect(response.body.data.tags).toEqual(['test', 'integration']);
      expect(response.body.data._id).toBeDefined();
    });

    test('should return validation error for invalid data', async () => {
      const invalidTaskData = {
        description: 'Task without title'
      };
      
      const response = await request(app)
        .post('/api/tasks')
        .send(invalidTaskData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation error');
      expect(response.body.details).toContain('Title is required');
    });
  });

  describe('GET /api/tasks', () => {
    beforeEach(async () => {
      // Create test data
      await Task.create([
        { title: 'Task 1', priority: 'high', completed: false, tags: ['work'] },
        { title: 'Task 2', priority: 'medium', completed: true, tags: ['personal'] },
        { title: 'Task 3', priority: 'low', completed: false, tags: ['work', 'urgent'] }
      ]);
    });

    test('should get all tasks', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(3);
      expect(response.body.data).toHaveLength(3);
    });

    test('should filter tasks by completion status', async () => {
      const response = await request(app)
        .get('/api/tasks?completed=true')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
      expect(response.body.data[0].completed).toBe(true);
    });

    test('should filter tasks by priority', async () => {
      const response = await request(app)
        .get('/api/tasks?priority=high')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
      expect(response.body.data[0].priority).toBe('high');
    });

    test('should filter tasks by tags', async () => {
      const response = await request(app)
        .get('/api/tasks?tags=work')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(response.body.data.every(task => task.tags.includes('work'))).toBe(true);
    });

    test('should sort tasks', async () => {
      const response = await request(app)
        .get('/api/tasks?sort=title&order=asc')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data[0].title).toBe('Task 1');
      expect(response.body.data[1].title).toBe('Task 2');
      expect(response.body.data[2].title).toBe('Task 3');
    });
  });

  describe('GET /api/tasks/:id', () => {
    let taskId;

    beforeEach(async () => {
      const task = await Task.create({
        title: 'Test Task',
        description: 'Test Description'
      });
      taskId = task._id.toString();
    });

    test('should get task by id', async () => {
      const response = await request(app)
        .get(`/api/tasks/${taskId}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(taskId);
      expect(response.body.data.title).toBe('Test Task');
    });

    test('should return 404 for non-existent task', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/tasks/${nonExistentId}`)
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Task not found');
    });

    test('should return 400 for invalid task id', async () => {
      const response = await request(app)
        .get('/api/tasks/invalid-id')
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid task ID');
    });
  });

  describe('PUT /api/tasks/:id', () => {
    let taskId;

    beforeEach(async () => {
      const task = await Task.create({
        title: 'Original Title',
        description: 'Original Description',
        priority: 'low'
      });
      taskId = task._id.toString();
    });

    test('should update task', async () => {
      const updateData = {
        title: 'Updated Title',
        description: 'Updated Description',
        priority: 'high'
      };
      
      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.description).toBe(updateData.description);
      expect(response.body.data.priority).toBe(updateData.priority);
    });

    test('should return 404 for non-existent task', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .put(`/api/tasks/${nonExistentId}`)
        .send({ title: 'Updated Title' })
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Task not found');
    });
  });

  describe('PATCH /api/tasks/:id/toggle', () => {
    let taskId;

    beforeEach(async () => {
      const task = await Task.create({
        title: 'Test Task',
        completed: false
      });
      taskId = task._id.toString();
    });

    test('should toggle task completion', async () => {
      const response = await request(app)
        .patch(`/api/tasks/${taskId}/toggle`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.completed).toBe(true);
      
      // Toggle again
      const response2 = await request(app)
        .patch(`/api/tasks/${taskId}/toggle`)
        .expect(200);
      
      expect(response2.body.success).toBe(true);
      expect(response2.body.data.completed).toBe(false);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    let taskId;

    beforeEach(async () => {
      const task = await Task.create({
        title: 'Task to Delete'
      });
      taskId = task._id.toString();
    });

    test('should delete task', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Task deleted successfully');
      
      // Verify task is deleted
      const deletedTask = await Task.findById(taskId);
      expect(deletedTask).toBeNull();
    });

    test('should return 404 for non-existent task', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .delete(`/api/tasks/${nonExistentId}`)
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Task not found');
    });
  });

  describe('GET /api/tasks/stats', () => {
    beforeEach(async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      await Task.create([
        { title: 'Completed Task', completed: true },
        { title: 'Pending Task', completed: false },
        { title: 'Overdue Task', completed: false, dueDate: yesterday }
      ]);
    });

    test('should get task statistics', async () => {
      const response = await request(app)
        .get('/api/tasks/stats')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBe(3);
      expect(response.body.data.completed).toBe(1);
      expect(response.body.data.pending).toBe(2);
      expect(response.body.data.overdue).toBe(1);
    });
  });

  describe('GET /api/tasks/overdue', () => {
    beforeEach(async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      await Task.create([
        { title: 'Overdue Task 1', completed: false, dueDate: yesterday },
        { title: 'Overdue Task 2', completed: false, dueDate: yesterday },
        { title: 'Completed Overdue Task', completed: true, dueDate: yesterday },
        { title: 'Future Task', completed: false, dueDate: tomorrow }
      ]);
    });

    test('should get overdue tasks', async () => {
      const response = await request(app)
        .get('/api/tasks/overdue')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(response.body.data.every(task => !task.completed && new Date(task.dueDate) < new Date())).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/unknown')
        .expect(404);
      
      expect(response.body.error).toBe('Route not found');
    });
  });
});