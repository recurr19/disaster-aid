import { io } from 'socket.io-client';

let socket = null;

export function connectRealtime() {
  if (!socket) {
    socket = io('http://localhost:5001', { transports: ['websocket'] });
  }
  return socket;
}

export function getSocket() {
  return socket;
}


