const jwt = require('jsonwebtoken');
const { Adhesion } = require('../models');

let io;

// Initialise Socket.IO sur le serveur HTTP existant.
// Chaque structure est une "room" (groupe) : seuls ses membres actifs peuvent
// y rejoindre le chat en temps réel (cas d'utilisation "Messagerie de groupe").
// Chaque utilisateur rejoint aussi sa room personnelle "user:{id}", utilisée
// pour les notifications ET pour la messagerie privée (DM/groupes), qui n'a
// pas besoin de room dédiée : on diffuse directement à chaque participant.
exports.initSocket = (httpServer) => {
  const { Server } = require('socket.io');
  io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentification requise.'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Token invalide.'));
    }
  });

  io.on('connection', (socket) => {
    // L'utilisateur rejoint automatiquement sa "room" personnelle pour les notifications
    socket.join(`user:${socket.user.id}`);

    socket.on('rejoindre_groupe', async (structureId) => {
      const adhesion = await Adhesion.findOne({
        where: { user_id: socket.user.id, structure_id: structureId, statut: 'active' },
      });
      if (adhesion) {
        socket.join(`structure:${structureId}`);
      }
    });

    socket.on('quitter_groupe', (structureId) => {
      socket.leave(`structure:${structureId}`);
    });

    socket.on('typing', ({ structureId, prenom }) => {
      socket.to(`structure:${structureId}`).emit('typing', { prenom });
    });

    // Messagerie privée : indicateur "en train d'écrire" relayé aux autres participants
    socket.on('dm_typing', ({ conversationId, participantIds, prenom }) => {
      (participantIds || [])
        .filter((id) => id !== socket.user.id)
        .forEach((id) => socket.to(`user:${id}`).emit('dm_typing', { conversationId, prenom }));
    });
  });

  return io;
};

exports.getIO = () => io;

// Diffuse un nouveau message de groupe à tous les membres connectés de la structure.
exports.emitNewMessage = (structureId, message) => {
  if (io) io.to(`structure:${structureId}`).emit('nouveau_message', message);
};

// Envoie une notification en temps réel à un utilisateur précis.
exports.emitNotification = (userId, notification) => {
  if (io) io.to(`user:${userId}`).emit('nouvelle_notification', notification);
};

// Diffuse un message de messagerie privée (direct ou groupe) à tous ses
// participants connectés, via leur room personnelle "user:{id}".
exports.emitDMMessage = async (conversationId, message) => {
  if (!io) return;
  const { DMParticipant } = require('../models');
  const participants = await DMParticipant.findAll({ where: { conversation_id: conversationId } });
  participants.forEach((p) => {
    io.to(`user:${p.user_id}`).emit('dm_nouveau_message', { conversationId: Number(conversationId), message });
  });
};
