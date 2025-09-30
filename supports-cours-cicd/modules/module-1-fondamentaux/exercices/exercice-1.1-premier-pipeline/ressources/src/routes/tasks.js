const express = require('express');
const Task = require('../models/task');

const router = express.Router();

// Stockage en mémoire pour la démonstration
// En production, ceci serait remplacé par une base de données
let tasks = [];

/**
 * GET /api/tasks
 * Récupère toutes les tâches
 */
router.get('/', (req, res) => {
  const { completed, search } = req.query;
  let filteredTasks = [...tasks];

  // Filtrage par statut de completion
  if (completed !== undefined) {
    const isCompleted = completed === 'true';
    filteredTasks = filteredTasks.filter(task => task.completed === isCompleted);
  }

  // Recherche dans le titre et la description
  if (search) {
    const searchLower = search.toLowerCase();
    filteredTasks = filteredTasks.filter(task => 
      task.title.toLowerCase().includes(searchLower) ||
      task.description.toLowerCase().includes(searchLower)
    );
  }

  res.json({
    tasks: filteredTasks.map(task => task.toJSON()),
    total: filteredTasks.length
  });
});

/**
 * GET /api/tasks/:id
 * Récupère une tâche par son ID
 */
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const task = tasks.find(t => t.id === id);

  if (!task) {
    return res.status(404).json({
      error: 'Task not found',
      id
    });
  }

  res.json(task.toJSON());
});

/**
 * POST /api/tasks
 * Crée une nouvelle tâche
 */
router.post('/', (req, res) => {
  const { title, description } = req.body;

  if (!title) {
    return res.status(400).json({
      error: 'Title is required'
    });
  }

  const task = new Task(title, description);
  const validation = task.validate();

  if (!validation.isValid) {
    return res.status(400).json({
      error: 'Validation failed',
      details: validation.errors
    });
  }

  tasks.push(task);

  res.status(201).json(task.toJSON());
});

/**
 * PUT /api/tasks/:id
 * Met à jour une tâche existante
 */
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const task = tasks.find(t => t.id === id);

  if (!task) {
    return res.status(404).json({
      error: 'Task not found',
      id
    });
  }

  const updatedFields = task.update(req.body);
  const validation = task.validate();

  if (!validation.isValid) {
    return res.status(400).json({
      error: 'Validation failed',
      details: validation.errors
    });
  }

  res.json({
    ...task.toJSON(),
    updatedFields
  });
});

/**
 * PATCH /api/tasks/:id/complete
 * Marque une tâche comme terminée
 */
router.patch('/:id/complete', (req, res) => {
  const { id } = req.params;
  const task = tasks.find(t => t.id === id);

  if (!task) {
    return res.status(404).json({
      error: 'Task not found',
      id
    });
  }

  task.complete();
  res.json(task.toJSON());
});

/**
 * PATCH /api/tasks/:id/uncomplete
 * Marque une tâche comme non terminée
 */
router.patch('/:id/uncomplete', (req, res) => {
  const { id } = req.params;
  const task = tasks.find(t => t.id === id);

  if (!task) {
    return res.status(404).json({
      error: 'Task not found',
      id
    });
  }

  task.uncomplete();
  res.json(task.toJSON());
});

/**
 * DELETE /api/tasks/:id
 * Supprime une tâche
 */
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const taskIndex = tasks.findIndex(t => t.id === id);

  if (taskIndex === -1) {
    return res.status(404).json({
      error: 'Task not found',
      id
    });
  }

  const deletedTask = tasks.splice(taskIndex, 1)[0];
  res.json({
    message: 'Task deleted successfully',
    task: deletedTask.toJSON()
  });
});

/**
 * DELETE /api/tasks
 * Supprime toutes les tâches (utile pour les tests)
 */
router.delete('/', (req, res) => {
  const deletedCount = tasks.length;
  tasks = [];
  
  res.json({
    message: `${deletedCount} tasks deleted successfully`,
    deletedCount
  });
});

module.exports = router;