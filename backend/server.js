const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const http = require('http');
const cors = require('cors');

const sequelize = require('./config/database');
require('./models'); // charge tous les modèles et associations
const { initSocket } = require('./utils/socket');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const structureRoutes = require('./routes/structureRoutes');
const adhesionRoutes = require('./routes/adhesionRoutes');
const evenementRoutes = require('./routes/evenementRoutes');
const annonceRoutes = require('./routes/annonceRoutes');
const cotisationRoutes = require('./routes/cotisationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const statsRoutes = require('./routes/statsRoutes');
const feedRoutes = require('./routes/feedRoutes');
const dmRoutes = require('./routes/dmRoutes');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/structures', structureRoutes);
app.use('/api/adhesions', adhesionRoutes);
app.use('/api/events', evenementRoutes);
app.use('/api/annonces', annonceRoutes);
app.use('/api/cotisations', cotisationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/messages', dmRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'API ESP Digital opérationnelle.' }));

// Gestion des routes non trouvées
app.use((req, res) => {
  res.status(404).json({ message: 'Route non trouvée.' });
});

// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Erreur interne du serveur.' });
});

const PORT = process.env.PORT || 5000;
const httpServer = http.createServer(app);
initSocket(httpServer);

const demarrerServeur = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données MySQL réussie.');

    // alter:true permet de garder les données existantes en ajustant le schéma.
    // Passez à { force: true } uniquement en développement pour réinitialiser la base.
    await sequelize.sync({ alter: true });
    console.log('✅ Modèles synchronisés avec la base de données.');

    httpServer.listen(PORT, () => {
      console.log(`🚀 Serveur ESP Digital (API + WebSocket) à l'écoute sur http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Impossible de démarrer le serveur :', error.message);
    process.exit(1);
  }
};

demarrerServeur();

module.exports = app;
