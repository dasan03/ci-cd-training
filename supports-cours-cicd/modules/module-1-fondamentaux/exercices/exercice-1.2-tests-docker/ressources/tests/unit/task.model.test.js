const Task = require('../../src/models/task');

describe('Task Model', () => {
  describe('Validation', () => {
    test('should create a valid task', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'This is a test task',
        priority: 'high'
      };
      
      const task = new Task(taskData);
      const savedTask = await task.save();
      
      expect(savedTask._id).toBeDefined();
      expect(savedTask.title).toBe(taskData.title);
      expect(savedTask.description).toBe(taskData.description);
      expect(savedTask.priority).toBe(taskData.priority);
      expect(savedTask.completed).toBe(false);
      expect(savedTask.createdAt).toBeDefined();
      expect(savedTask.updatedAt).toBeDefined();
    });

    test('should require title', async () => {
      const task = new Task({
        description: 'Task without title'
      });
      
      await expect(task.save()).rejects.toThrow('Title is required');
    });

    test('should trim title and description', async () => {
      const task = new Task({
        title: '  Test Task  ',
        description: '  Test Description  '
      });
      
      const savedTask = await task.save();
      expect(savedTask.title).toBe('Test Task');
      expect(savedTask.description).toBe('Test Description');
    });

    test('should validate title length', async () => {
      const longTitle = 'a'.repeat(101);
      const task = new Task({
        title: longTitle
      });
      
      await expect(task.save()).rejects.toThrow('Title cannot exceed 100 characters');
    });

    test('should validate description length', async () => {
      const longDescription = 'a'.repeat(501);
      const task = new Task({
        title: 'Valid Title',
        description: longDescription
      });
      
      await expect(task.save()).rejects.toThrow('Description cannot exceed 500 characters');
    });

    test('should validate priority enum', async () => {
      const task = new Task({
        title: 'Test Task',
        priority: 'invalid'
      });
      
      await expect(task.save()).rejects.toThrow();
    });

    test('should validate future due date', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      
      const task = new Task({
        title: 'Test Task',
        dueDate: pastDate
      });
      
      await expect(task.save()).rejects.toThrow('Due date must be in the future');
    });

    test('should allow null due date', async () => {
      const task = new Task({
        title: 'Test Task',
        dueDate: null
      });
      
      const savedTask = await task.save();
      expect(savedTask.dueDate).toBeNull();
    });

    test('should convert tags to lowercase', async () => {
      const task = new Task({
        title: 'Test Task',
        tags: ['URGENT', 'Work', 'PROJECT']
      });
      
      const savedTask = await task.save();
      expect(savedTask.tags).toEqual(['urgent', 'work', 'project']);
    });
  });

  describe('Instance Methods', () => {
    test('should toggle completion status', async () => {
      const task = new Task({
        title: 'Test Task',
        completed: false
      });
      
      await task.save();
      expect(task.completed).toBe(false);
      
      await task.toggleComplete();
      expect(task.completed).toBe(true);
      
      await task.toggleComplete();
      expect(task.completed).toBe(false);
    });

    test('should detect overdue tasks', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      
      const overdueTask = new Task({
        title: 'Overdue Task',
        dueDate: pastDate,
        completed: false
      });
      
      const completedOverdueTask = new Task({
        title: 'Completed Overdue Task',
        dueDate: pastDate,
        completed: true
      });
      
      const futureTask = new Task({
        title: 'Future Task',
        dueDate: new Date(Date.now() + 86400000), // Tomorrow
        completed: false
      });
      
      expect(overdueTask.isOverdue()).toBe(true);
      expect(completedOverdueTask.isOverdue()).toBe(false);
      expect(futureTask.isOverdue()).toBe(false);
    });
  });

  describe('Static Methods', () => {
    beforeEach(async () => {
      // Create test data
      await Task.create([
        { title: 'High Priority Task', priority: 'high', completed: false },
        { title: 'Medium Priority Task', priority: 'medium', completed: true },
        { title: 'Low Priority Task', priority: 'low', completed: false },
        { 
          title: 'Overdue Task', 
          priority: 'high', 
          completed: false,
          dueDate: new Date(Date.now() - 86400000) // Yesterday
        }
      ]);
    });

    test('should find tasks by priority', async () => {
      const highPriorityTasks = await Task.findByPriority('high');
      expect(highPriorityTasks).toHaveLength(2);
      expect(highPriorityTasks.every(task => task.priority === 'high')).toBe(true);
    });

    test('should find overdue tasks', async () => {
      const overdueTasks = await Task.findOverdue();
      expect(overdueTasks).toHaveLength(1);
      expect(overdueTasks[0].title).toBe('Overdue Task');
    });

    test('should get task statistics', async () => {
      const stats = await Task.getStats();
      
      expect(stats.total).toBe(4);
      expect(stats.completed).toBe(1);
      expect(stats.pending).toBe(3);
      expect(stats.overdue).toBe(1);
    });
  });

  describe('Middleware', () => {
    test('should update updatedAt on save', async () => {
      const task = new Task({
        title: 'Test Task'
      });
      
      const savedTask = await task.save();
      const originalUpdatedAt = savedTask.updatedAt;
      
      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));
      
      savedTask.description = 'Updated description';
      await savedTask.save();
      
      expect(savedTask.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});