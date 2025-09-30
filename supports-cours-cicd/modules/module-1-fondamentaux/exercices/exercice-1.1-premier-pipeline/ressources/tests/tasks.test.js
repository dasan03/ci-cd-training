const request = require('supertest');
const app = require('../src/app');
const Task = require('../src/models/task');

describe('Tasks API', () => {
  // Nettoyer les tâches avant chaque test
  beforeEach(async () => {
    await request(app).delete('/api/tasks');
  });

  describe('GET /api/tasks', () => {
    test('should return empty array when no tasks exist', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .expect(200);

      expect(response.body).toHaveProperty('tasks', []);
      expect(response.body).toHaveProperty('total', 0);
    });

    test('should return all tasks when they exist', async () => {
      // Créer quelques tâches
      await request(app)
        .post('/api/tasks')
        .send({ title: 'Task 1', description: 'Description 1' });
      
      await request(app)
        .post('/api/tasks')
        .send({ title: 'Task 2', description: 'Description 2' });

      const response = await request(app)
        .get('/api/tasks')
        .expect(200);

      expect(response.body.tasks).toHaveLength(2);
      expect(response.body.total).toBe(2);
      expect(response.body.tasks[0]).toHaveProperty('title', 'Task 1');
      expect(response.body.tasks[1]).toHaveProperty('title', 'Task 2');
    });

    test('should filter tasks by completion status', async () => {
      // Créer une tâche et la marquer comme terminée
      const taskResponse = await request(app)
        .post('/api/tasks')
        .send({ title: 'Completed Task' });

      await request(app)
        .patch(`/api/tasks/${taskResponse.body.id}/complete`);

      // Créer une tâche non terminée
      await request(app)
        .post('/api/tasks')
        .send({ title: 'Incomplete Task' });

      // Tester le filtre pour les tâches terminées
      const completedResponse = await request(app)
        .get('/api/tasks?completed=true')
        .expect(200);

      expect(completedResponse.body.tasks).toHaveLength(1);
      expect(completedResponse.body.tasks[0].completed).toBe(true);

      // Tester le filtre pour les tâches non terminées
      const incompleteResponse = await request(app)
        .get('/api/tasks?completed=false')
        .expect(200);

      expect(incompleteResponse.body.tasks).toHaveLength(1);
      expect(incompleteResponse.body.tasks[0].completed).toBe(false);
    });

    test('should search tasks by title and description', async () => {
      await request(app)
        .post('/api/tasks')
        .send({ title: 'Important Meeting', description: 'Discuss project' });
      
      await request(app)
        .post('/api/tasks')
        .send({ title: 'Buy groceries', description: 'Milk and bread' });

      // Recherche dans le titre
      const titleSearch = await request(app)
        .get('/api/tasks?search=meeting')
        .expect(200);

      expect(titleSearch.body.tasks).toHaveLength(1);
      expect(titleSearch.body.tasks[0].title).toContain('Meeting');

      // Recherche dans la description
      const descSearch = await request(app)
        .get('/api/tasks?search=milk')
        .expect(200);

      expect(descSearch.body.tasks).toHaveLength(1);
      expect(descSearch.body.tasks[0].description).toContain('Milk');
    });
  });

  describe('GET /api/tasks/:id', () => {
    test('should return specific task by id', async () => {
      const createResponse = await request(app)
        .post('/api/tasks')
        .send({ title: 'Specific Task', description: 'Specific Description' });

      const taskId = createResponse.body.id;

      const response = await request(app)
        .get(`/api/tasks/${taskId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', taskId);
      expect(response.body).toHaveProperty('title', 'Specific Task');
      expect(response.body).toHaveProperty('description', 'Specific Description');
    });

    test('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .get('/api/tasks/non-existent-id')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Task not found');
      expect(response.body).toHaveProperty('id', 'non-existent-id');
    });
  });

  describe('POST /api/tasks', () => {
    test('should create new task with valid data', async () => {
      const taskData = {
        title: 'New Task',
        description: 'Task description'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title', taskData.title);
      expect(response.body).toHaveProperty('description', taskData.description);
      expect(response.body).toHaveProperty('completed', false);
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
    });

    test('should create task with only title', async () => {
      const taskData = { title: 'Title Only Task' };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(201);

      expect(response.body).toHaveProperty('title', taskData.title);
      expect(response.body).toHaveProperty('description', '');
    });

    test('should return 400 when title is missing', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({ description: 'No title' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Title is required');
    });

    test('should return 400 when title is empty string', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({ title: '   ', description: 'Empty title' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
      expect(response.body.details).toContain('Title cannot be empty');
    });

    test('should return 400 when title is too long', async () => {
      const longTitle = 'a'.repeat(201);
      
      const response = await request(app)
        .post('/api/tasks')
        .send({ title: longTitle })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
      expect(response.body.details).toContain('Title cannot exceed 200 characters');
    });
  });

  describe('PUT /api/tasks/:id', () => {
    test('should update existing task', async () => {
      const createResponse = await request(app)
        .post('/api/tasks')
        .send({ title: 'Original Title', description: 'Original Description' });

      const taskId = createResponse.body.id;
      const updateData = {
        title: 'Updated Title',
        description: 'Updated Description',
        completed: true
      };

      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('title', updateData.title);
      expect(response.body).toHaveProperty('description', updateData.description);
      expect(response.body).toHaveProperty('completed', updateData.completed);
      expect(response.body.updatedFields).toEqual(['title', 'description', 'completed']);
    });

    test('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .put('/api/tasks/non-existent-id')
        .send({ title: 'Updated Title' })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Task not found');
    });
  });

  describe('PATCH /api/tasks/:id/complete', () => {
    test('should mark task as completed', async () => {
      const createResponse = await request(app)
        .post('/api/tasks')
        .send({ title: 'Task to Complete' });

      const taskId = createResponse.body.id;

      const response = await request(app)
        .patch(`/api/tasks/${taskId}/complete`)
        .expect(200);

      expect(response.body).toHaveProperty('completed', true);
      expect(response.body.updatedAt).not.toBe(createResponse.body.updatedAt);
    });
  });

  describe('PATCH /api/tasks/:id/uncomplete', () => {
    test('should mark task as not completed', async () => {
      const createResponse = await request(app)
        .post('/api/tasks')
        .send({ title: 'Task to Uncomplete' });

      const taskId = createResponse.body.id;

      // D'abord marquer comme terminée
      await request(app)
        .patch(`/api/tasks/${taskId}/complete`);

      // Puis marquer comme non terminée
      const response = await request(app)
        .patch(`/api/tasks/${taskId}/uncomplete`)
        .expect(200);

      expect(response.body).toHaveProperty('completed', false);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    test('should delete existing task', async () => {
      const createResponse = await request(app)
        .post('/api/tasks')
        .send({ title: 'Task to Delete' });

      const taskId = createResponse.body.id;

      const response = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Task deleted successfully');
      expect(response.body.task).toHaveProperty('id', taskId);

      // Vérifier que la tâche n'existe plus
      await request(app)
        .get(`/api/tasks/${taskId}`)
        .expect(404);
    });

    test('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .delete('/api/tasks/non-existent-id')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Task not found');
    });
  });

  describe('DELETE /api/tasks', () => {
    test('should delete all tasks', async () => {
      // Créer quelques tâches
      await request(app).post('/api/tasks').send({ title: 'Task 1' });
      await request(app).post('/api/tasks').send({ title: 'Task 2' });
      await request(app).post('/api/tasks').send({ title: 'Task 3' });

      const response = await request(app)
        .delete('/api/tasks')
        .expect(200);

      expect(response.body).toHaveProperty('deletedCount', 3);
      expect(response.body.message).toContain('3 tasks deleted successfully');

      // Vérifier que toutes les tâches ont été supprimées
      const getResponse = await request(app)
        .get('/api/tasks')
        .expect(200);

      expect(getResponse.body.tasks).toHaveLength(0);
    });
  });
});