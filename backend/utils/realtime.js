/**
 * Realtime Synchronization Engine for KalaStyle AI
 * Broadcasts events across all connected devices (Admin, Artisan, Shopper)
 */

let ioInstance = null;

const initRealtime = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    // Client connected
    socket.on('join_room', (room) => {
      if (room) socket.join(room);
    });

    socket.on('ping_sync', () => {
      socket.emit('pong_sync', { timestamp: Date.now() });
    });
  });

  console.log('⚡ KalaStyle Multi-Device Realtime Sync Engine Initialized');
};

const broadcastSync = (type, payload = {}) => {
  if (!ioInstance) {
    return;
  }

  const eventData = {
    type,
    payload,
    timestamp: Date.now()
  };

  try {
    // Broadcast to all connected clients across all devices
    ioInstance.emit('KALA_SYNC', eventData);
    // Also emit specific type for granular listeners
    ioInstance.emit(`KALA_SYNC:${type}`, eventData);
  } catch (err) {
    console.error('❌ Error broadcasting realtime sync event:', err.message);
  }
};

module.exports = {
  initRealtime,
  broadcastSync,
  getIo: () => ioInstance,
};
