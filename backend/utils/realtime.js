const supabase = require('../config/supabase');

let ioInstance = null;
let supaChannel = null;

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

  try {
    if (supabase && typeof supabase.channel === 'function') {
      supaChannel = supabase.channel('kalastyle_live_sync');
      supaChannel.subscribe();
    }
  } catch (supaErr) {
    console.warn('Backend Supabase realtime channel init notice:', supaErr.message);
  }

  console.log('⚡ KalaStyle Multi-Device Realtime Sync Engine Initialized');
};

const broadcastSync = (type, payload = {}) => {
  const eventData = {
    type,
    payload,
    timestamp: Date.now()
  };

  // 1. Broadcast via Socket.IO
  if (ioInstance) {
    try {
      ioInstance.emit('KALA_SYNC', eventData);
      ioInstance.emit(`KALA_SYNC:${type}`, eventData);
    } catch (err) {
      console.error('❌ Error broadcasting realtime sync event via Socket.IO:', err.message);
    }
  }

  // 2. Broadcast via Supabase Realtime Channel
  try {
    if (supaChannel && typeof supaChannel.send === 'function') {
      supaChannel.send({
        type: 'broadcast',
        event: 'KALA_SYNC',
        payload: { type, data: payload }
      }).catch(() => {});
    }
  } catch (supaErr) {
    // Non-blocking notice
  }
};

module.exports = {
  initRealtime,
  broadcastSync,
  getIo: () => ioInstance,
};
