let ioInstance = null;

function init(server) {
  const { Server } = require('socket.io');
  ioInstance = new Server(server, {
    cors: {
      origin: '*'
    }
  });
  ioInstance.on('connection', (socket) => {
    // Clients may join rooms if needed later
    socket.on('join', (room) => {
      socket.join(room);
    });
  });
}

function io() {
  return ioInstance;
}

function emit(event, payload) {
  if (ioInstance) {
    ioInstance.emit(event, payload);
  } else {
    console.log(`[Realtime fallback] ${event}`, payload);
  }
}

module.exports = { init, io, emit };


