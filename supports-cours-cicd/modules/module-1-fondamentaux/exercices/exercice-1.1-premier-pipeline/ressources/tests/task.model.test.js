const Task = require('../src/models/task');

describe('Task Model', () => {
  describe('Constructor', () => {
    test('should create task with title and description', () => {
      const task = new Task('Test Task', 'Test Description');

      expect(task.title).toBe('Test Task');
      expect(task.description).toBe('Test Description');
      expect(task.completed).toBe(false);
      expect(task.id).toBeDefined();
      expect(task.createdAt).toBeDefined();
      expect(task.updatedAt).toBeDefined();
    });

    test('should create task with only title', () => {
      const task = new Task('Test Task');

      expect(task.title).toBe('Test Task');
      expect(task.description).toBe('');
      expect(task.completed).toBe(false);
    });

    test('should generate unique IDs for different tasks', () => {
      const task1 = new Task('Task 1');
      const task2 = new Task('Task 2');

      expect(task1.id).not.toBe(task2.id);
    });
  });

  describe('Validation', () => {
    test('should validate correct task data', () => {
      const task = new Task('Valid Task', 'Valid Description');
      const validation = task.validate();

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should reject empty title', () => {
      const task = new Task('');
      const validation = task.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Title cannot be empty');
    });

    test('should reject whitespace-only title', () => {
      const task = new Task('   ');
      const validation = task.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Title cannot be empty');
    });

    test('should reject non-string title', () => {
      const task = new Task(123);
      const validation = task.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Title is required and must be a string');
    });

    test('should reject title longer than 200 characters', () => {
      const longTitle = 'a'.repeat(201);
      const task = new Task(longTitle);
      const validation = task.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Title cannot exceed 200 characters');
    });

    test('should reject non-string description', () => {
      const task = new Task('Valid Title', 123);
      const validation = task.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Description must be a string');
    });

    test('should reject description longer than 1000 characters', () => {
      const longDescription = 'a'.repeat(1001);
      const task = new Task('Valid Title', longDescription);
      const validation = task.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Description cannot exceed 1000 characters');
    });

    test('should accept empty description', () => {
      const task = new Task('Valid Title', '');
      const validation = task.validate();

      expect(validation.isValid).toBe(true);
    });
  });

  describe('Complete/Uncomplete', () => {
    test('should mark task as completed', () => {
      const task = new Task('Test Task');
      const originalUpdatedAt = task.updatedAt;

      // Attendre un peu pour s'assurer que updatedAt change
      setTimeout(() => {
        task.complete();

        expect(task.completed).toBe(true);
        expect(task.updatedAt).not.toBe(originalUpdatedAt);
      }, 1);
    });

    test('should mark task as not completed', () => {
      const task = new Task('Test Task');
      task.complete(); // D'abord marquer comme terminée
      const originalUpdatedAt = task.updatedAt;

      setTimeout(() => {
        task.uncomplete();

        expect(task.completed).toBe(false);
        expect(task.updatedAt).not.toBe(originalUpdatedAt);
      }, 1);
    });
  });

  describe('Update', () => {
    test('should update allowed properties', () => {
      const task = new Task('Original Title', 'Original Description');
      const originalUpdatedAt = task.updatedAt;

      setTimeout(() => {
        const updatedFields = task.update({
          title: 'Updated Title',
          description: 'Updated Description',
          completed: true
        });

        expect(task.title).toBe('Updated Title');
        expect(task.description).toBe('Updated Description');
        expect(task.completed).toBe(true);
        expect(task.updatedAt).not.toBe(originalUpdatedAt);
        expect(updatedFields).toEqual(['title', 'description', 'completed']);
      }, 1);
    });

    test('should ignore non-allowed properties', () => {
      const task = new Task('Test Task');
      const originalId = task.id;
      const originalCreatedAt = task.createdAt;

      const updatedFields = task.update({
        id: 'new-id',
        createdAt: 'new-date',
        invalidProperty: 'invalid'
      });

      expect(task.id).toBe(originalId);
      expect(task.createdAt).toBe(originalCreatedAt);
      expect(task.invalidProperty).toBeUndefined();
      expect(updatedFields).toHaveLength(0);
    });

    test('should not update updatedAt if no valid updates', () => {
      const task = new Task('Test Task');
      const originalUpdatedAt = task.updatedAt;

      task.update({ invalidProperty: 'invalid' });

      expect(task.updatedAt).toBe(originalUpdatedAt);
    });
  });

  describe('JSON Serialization', () => {
    test('should convert to JSON correctly', () => {
      const task = new Task('Test Task', 'Test Description');
      const json = task.toJSON();

      expect(json).toHaveProperty('id', task.id);
      expect(json).toHaveProperty('title', 'Test Task');
      expect(json).toHaveProperty('description', 'Test Description');
      expect(json).toHaveProperty('completed', false);
      expect(json).toHaveProperty('createdAt', task.createdAt);
      expect(json).toHaveProperty('updatedAt', task.updatedAt);
    });

    test('should create task from JSON', () => {
      const data = {
        id: 'test-id',
        title: 'Test Task',
        description: 'Test Description',
        completed: true,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };

      const task = Task.fromJSON(data);

      expect(task.id).toBe(data.id);
      expect(task.title).toBe(data.title);
      expect(task.description).toBe(data.description);
      expect(task.completed).toBe(data.completed);
      expect(task.createdAt).toBe(data.createdAt);
      expect(task.updatedAt).toBe(data.updatedAt);
    });

    test('should create task from partial JSON', () => {
      const data = {
        title: 'Test Task',
        description: 'Test Description'
      };

      const task = Task.fromJSON(data);

      expect(task.title).toBe(data.title);
      expect(task.description).toBe(data.description);
      expect(task.completed).toBe(false);
      expect(task.id).toBeDefined();
      expect(task.createdAt).toBeDefined();
      expect(task.updatedAt).toBeDefined();
    });
  });
});