import { io } from 'socket.io-client';

let socket = null;

export function connectRealtime(userId = null, userRole = null) {
  if (!socket) {
    socket = io('http://localhost:5001', { transports: ['websocket'] });
    
    socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      
      // Join user-specific room if userId provided
      if (userId) {
        socket.emit('join', `user:${userId}`);
        console.log(`Joined room: user:${userId}`);
      }
      
      // Join role-specific room (ngo:<ngoId>, dispatcher:<id>, etc.) if applicable
      if (userRole && userId) {
        socket.emit('join', `${userRole}:${userId}`);
        console.log(`Joined room: ${userRole}:${userId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
    });

    socket.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });
  }
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectRealtime() {
  if (socket) {
    socket.close();
    socket = null;
  }
}

