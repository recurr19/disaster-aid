let ioInstance = null;
const axios = require('axios');
const RegisteredNGO = require('../models/RegisteredNGO');

function init(server) {
  const { Server } = require('socket.io');
  ioInstance = new Server(server, {
    cors: {
      origin: '*'
    }
  });

  ioInstance.on('connection', (socket) => {
    console.log('🔌 New WebSocket connection:', socket.id);
    
    // Clients may join rooms (e.g., `ngo:<id>`, `ticket:<ticketId>`, `dispatcher:<id>`, `user:<id>`)
    socket.on('join', (room) => {
      try {
        socket.join(room);
        console.log(`✅ Socket ${socket.id} joined room: ${room}`);
      } catch (e) {
        console.error(`❌ Failed to join room ${room}:`, e);
      }
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected:', socket.id);
    });
  });
}

function io() {
  return ioInstance;
}

/**
 * Emit an event.
 * Options:
 *  - ngoId: emit to room `ngo:<ngoId>` and (if configured) POST webhook for that NGO
 *  - ticketId: emit to room `ticket:<ticketId>`
 *  - dispatcherId: emit to room `dispatcher:<dispatcherId>`
 *  - userId: emit to room `user:<userId>` (for citizens)
 *  - broadcast: true to emit to all clients (default false)
 */
async function emit(event, payload, options = {}) {
  if (!ioInstance) {
    console.log(`[Realtime fallback] ${event}`, payload, options);
    return;
  }

  try {
    const { ngoId, ticketId, dispatcherId, userId, broadcast } = options;

    // Targeted emit to ticket room
    if (ticketId) {
      ioInstance.to(`ticket:${ticketId}`).emit(event, payload);
    }

    // Targeted emit to dispatcher room
    if (dispatcherId) {
      ioInstance.to(`dispatcher:${dispatcherId}`).emit(event, payload);
    }

    // Targeted emit to user/citizen room
    if (userId) {
      ioInstance.to(`user:${userId}`).emit(event, payload);
    }

    // Targeted emit to NGO room
    if (ngoId) {
      const room = `ngo:${ngoId}`;
      console.log(`📡 Emitting '${event}' to room: ${room}`, payload);
      ioInstance.to(room).emit(event, payload);

      // If NGO has webhook configured, POST the payload
      try {
        const ngo = await RegisteredNGO.findById(ngoId).lean();
        if (ngo && ngo.webhookUrl) {
          // fire-and-forget POST
          axios.post(ngo.webhookUrl, { event, payload }).catch(err => {
            console.error('Realtime webhook POST failed for NGO', ngoId, err?.message || err);
          });
        }
      } catch (e) {
        console.error('Realtime webhook lookup failed for NGO', ngoId, e?.message || e);
      }
    }

    // Broadcast to all if requested
    if (broadcast) {
      ioInstance.emit(event, payload);
    }
  } catch (e) {
    console.error('Realtime emit error:', e?.message || e);
  }
}

module.exports = { init, io, emit };


