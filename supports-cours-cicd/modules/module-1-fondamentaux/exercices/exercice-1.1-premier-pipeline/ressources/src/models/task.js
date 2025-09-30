const { v4: uuidv4 } = require('uuid');

class Task {
  constructor(title, description = '') {
    this.id = uuidv4();
    this.title = title;
    this.description = description;
    this.completed = false;
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Valide les données de la tâche
   * @returns {Object} Résultat de validation avec isValid et errors
   */
  validate() {
    const errors = [];

    if (!this.title || typeof this.title !== 'string') {
      errors.push('Title is required and must be a string');
    }

    if (this.title && this.title.trim().length === 0) {
      errors.push('Title cannot be empty');
    }

    if (this.title && this.title.length > 200) {
      errors.push('Title cannot exceed 200 characters');
    }

    if (this.description && typeof this.description !== 'string') {
      errors.push('Description must be a string');
    }

    if (this.description && this.description.length > 1000) {
      errors.push('Description cannot exceed 1000 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Marque la tâche comme terminée
   */
  complete() {
    this.completed = true;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Marque la tâche comme non terminée
   */
  uncomplete() {
    this.completed = false;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Met à jour les propriétés de la tâche
   * @param {Object} updates - Propriétés à mettre à jour
   */
  update(updates) {
    const allowedUpdates = ['title', 'description', 'completed'];
    const actualUpdates = Object.keys(updates).filter(key => allowedUpdates.includes(key));

    actualUpdates.forEach(key => {
      this[key] = updates[key];
    });

    if (actualUpdates.length > 0) {
      this.updatedAt = new Date().toISOString();
    }

    return actualUpdates;
  }

  /**
   * Retourne une représentation JSON de la tâche
   * @returns {Object} Objet JSON de la tâche
   */
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      completed: this.completed,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Crée une tâche à partir d'un objet JSON
   * @param {Object} data - Données de la tâche
   * @returns {Task} Instance de Task
   */
  static fromJSON(data) {
    const task = new Task(data.title, data.description);
    
    if (data.id) task.id = data.id;
    if (data.completed !== undefined) task.completed = data.completed;
    if (data.createdAt) task.createdAt = data.createdAt;
    if (data.updatedAt) task.updatedAt = data.updatedAt;

    return task;
  }
}

module.exports = Task;