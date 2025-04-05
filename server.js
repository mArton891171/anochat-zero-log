const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

let waitingSocket = null;
let userCount = 0;
const activeRooms = {};

io.on('connection', socket => {
  userCount++;
  io.emit('onlineCount', userCount);

  // Partnerkeresés indul
  tryPairing(socket);

  socket.on('message', ({ room, msg }) => {
    const now = new Date().toLocaleTimeString();
    const lowerMsg = msg.toLowerCase();

    const blockedDomains = ["grabify.io", "iplogger.org", "bit.ly"];
    let flagged = blockedDomains.some(domain => lowerMsg.includes(domain));

    let cleanMsg = msg.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    if (flagged) cleanMsg += " ⚠️ (Link figyelmeztetés)";

    socket.to(room).emit('message', {
      user: 'Partner',
      msg: cleanMsg,
      time: now
    });
  });

  socket.on('newPartner', () => {
    const prevRoom = activeRooms[socket.id];
    if (prevRoom) {
      socket.to(prevRoom).emit('partnerLeft');
      socket.leave(prevRoom);
      delete activeRooms[socket.id];
    }

    tryPairing(socket);
  });

  socket.on('disconnect', () => {
    userCount--;
    io.emit('onlineCount', userCount);

    const room = activeRooms[socket.id];
    if (room) {
      socket.to(room).emit('partnerLeft');
      delete activeRooms[socket.id];
    }

    if (waitingSocket === socket) {
      waitingSocket = null;
    }
  });
});

function tryPairing(socket) {
  if (waitingSocket && waitingSocket !== socket) {
    const room = generateRoomID();
    activeRooms[socket.id] = room;
    activeRooms[waitingSocket.id] = room;

    socket.join(room);
    waitingSocket.join(room);

    socket.emit('partnerFound', { room, partnerName: 'Partner' });
    waitingSocket.emit('partnerFound', { room, partnerName: 'Partner' });

    waitingSocket = null;
  } else {
    waitingSocket = socket;
    socket.emit('waiting');
  }
}

function generateRoomID() {
  return Math.random().toString(36).substring(2, 10);
}

http.listen(PORT, () => {
  console.log(`AnoChat fut: http://localhost:${PORT}`);
});
