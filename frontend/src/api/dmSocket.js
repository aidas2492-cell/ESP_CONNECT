import { useEffect, useRef } from 'react';
import { getSocket } from './socket';

// Hook pratique pour écouter les nouveaux messages privés (DM/groupes) et les
// indicateurs de saisie, sur toutes les conversations de l'utilisateur (pas
// besoin de rejoindre une room : le serveur diffuse via la room personnelle).
export const useDMSocket = (onNewMessage, onTyping) => {
  const messageHandler = useRef(onNewMessage);
  const typingHandler = useRef(onTyping);
  messageHandler.current = onNewMessage;
  typingHandler.current = onTyping;

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleMessage = (payload) => messageHandler.current?.(payload);
    const handleTyping = (payload) => typingHandler.current?.(payload);

    socket.on('dm_nouveau_message', handleMessage);
    socket.on('dm_typing', handleTyping);

    return () => {
      socket.off('dm_nouveau_message', handleMessage);
      socket.off('dm_typing', handleTyping);
    };
  }, []);
};
