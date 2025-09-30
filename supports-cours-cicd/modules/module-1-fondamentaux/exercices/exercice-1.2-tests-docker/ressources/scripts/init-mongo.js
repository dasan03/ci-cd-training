// Script d'initialisation MongoDB pour les tests
db = db.getSiblingDB('todoapp_test');

// Créer un utilisateur de test (optionnel)
db.createUser({
  user: 'testuser',
  pwd: 'testpass',
  roles: [
    {
      role: 'readWrite',
      db: 'todoapp_test'
    }
  ]
});

// Créer des index pour optimiser les performances des tests
db.tasks.createIndex({ "title": 1 });
db.tasks.createIndex({ "completed": 1 });
db.tasks.createIndex({ "priority": 1 });
db.tasks.createIndex({ "dueDate": 1 });
db.tasks.createIndex({ "tags": 1 });
db.tasks.createIndex({ "createdAt": -1 });

// Insérer des données de test de base (optionnel)
db.tasks.insertMany([
  {
    title: "Tâche de test 1",
    description: "Description de test",
    completed: false,
    priority: "medium",
    tags: ["test", "demo"],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "Tâche de test 2",
    description: "Autre description de test",
    completed: true,
    priority: "high",
    tags: ["test", "completed"],
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

print('Base de données de test initialisée avec succès');