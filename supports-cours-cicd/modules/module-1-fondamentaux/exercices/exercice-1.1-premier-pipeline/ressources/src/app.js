const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const tasksRouter = require('./routes/tasks');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de sécurité et configuration
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/tasks', tasksRouter);

// Route de santé pour les tests
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Gestion des erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Gestion globale des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Démarrage du serveur seulement si ce fichier est exécuté directement
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📝 API endpoint: http://localhost:${PORT}/api/tasks`);
  });
}

module.exports = app;