// Helper functions for socket communications
import { Server, Socket } from "socket.io";

/**
 * Get all sockets for a specific player from socket.io Server instance
 */
export const getPlayerSockets = (io: Server, playerId: string): Socket[] => {
  return Array.from(io.sockets.sockets.values()).filter(
    (s: Socket) => s.handshake.query.playerId === playerId
  );
};

/**
 * Sends an event to a specific player through all their connected sockets
 */
export const sendToPlayer = (
  io: Server,
  playerId: string,
  eventName: string,
  data: any
): boolean => {
  const playerSockets = getPlayerSockets(io, playerId);

  if (playerSockets.length > 0) {
    console.log(
      `Sending ${eventName} to player ${playerId} via ${playerSockets.length} socket(s)`
    );
    playerSockets.forEach((s) => s.emit(eventName, data));
    return true;
  }

  console.warn(`No sockets found for player ${playerId}`);
  return false;
};

/**
 * Enhanced room broadcast with redundancy
 * Will broadcast to room, then to individual sockets as backup
 */
export const reliableBroadcast = (
  io: Server,
  roomName: string,
  eventName: string,
  data: any
): void => {
  // Generate a unique event ID for tracking/debugging
  const eventId = `${eventName}-${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  const dataWithId = { ...data, _eventId: eventId };

  // First broadcast to room
  console.log(
    `Broadcasting ${eventName} to room ${roomName} with event ID ${eventId}`
  );
  io.to(roomName).emit(eventName, dataWithId);

  // Get all sockets in the room
  const room = io.sockets.adapter.rooms.get(roomName);
  if (!room) {
    console.warn(`Room ${roomName} not found for reliable broadcast`);
    return;
  }

  // After a short delay, also send directly to each socket as backup
  setTimeout(() => {
    console.log(`Sending redundant ${eventName} messages for event ${eventId}`);

    // Get array of socket IDs in the room
    const socketIds = [...room];

    // Send to each socket directly
    socketIds.forEach((socketId) => {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        socket.emit(eventName, dataWithId);
      }
    });
  }, 300);
};
