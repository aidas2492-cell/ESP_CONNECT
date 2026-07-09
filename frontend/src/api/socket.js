import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

let sharedSocket = null;

// Un seul socket partagé pour toute l'application, connecté une fois que
// l'utilisateur est authentifié. Le token JWT est transmis à la connexion.
export const getSocket = () => {
  const token = localStorage.getItem('espconnect_token');
  if (!token) return null;

  if (!sharedSocket) {
    const url = import.meta.env.VITE_SOCKET_URL || '/';
    sharedSocket = io(url, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
    });
  }
  return sharedSocket;
};

export const disconnectSocket = () => {
  if (sharedSocket) {
    sharedSocket.disconnect();
    sharedSocket = null;
  }
};

// Hook pratique pour rejoindre/quitter la room d'une structure (le "groupe")
export const useGroupSocket = (structureId, onMessage, onTyping) => {
  const messageHandler = useRef(onMessage);
  const typingHandler = useRef(onTyping);
  messageHandler.current = onMessage;
  typingHandler.current = onTyping;

  useEffect(() => {
    if (!structureId) return;
    const socket = getSocket();
    if (!socket) return;

    socket.emit('rejoindre_groupe', structureId);

    const handleMessage = (msg) => messageHandler.current?.(msg);
    const handleTyping = (data) => typingHandler.current?.(data);

    socket.on('nouveau_message', handleMessage);
    socket.on('typing', handleTyping);

    return () => {
      socket.emit('quitter_groupe', structureId);
      socket.off('nouveau_message', handleMessage);
      socket.off('typing', handleTyping);
    };
  }, [structureId]);
};
