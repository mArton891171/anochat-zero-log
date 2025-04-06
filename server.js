const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

let waitingUser = null;

io.on('connection', socket => {
  console.log(`Felhasználó csatlakozott: ${socket.id}`);

  function pairUser() {
    if (waitingUser && waitingUser.id !== socket.id) {
      const room = `room-${socket.id}-${waitingUser.id}`;
      socket.join(room);
      waitingUser.join(room);

      socket.room = room;
      waitingUser.room = room;

      socket.emit('paired', { room });
      waitingUser.emit('paired', { room });

      waitingUser = null;
    } else {
      waitingUser = socket;
      socket.emit('waiting');
    }
  }

  pairUser();

  socket.on('message', ({ room, msg }) => {
    socket.to(room).emit('message', msg);
  });

  socket.on('search-new', () => {
    if (socket.room) socket.leave(socket.room);
    socket.room = null;
    pairUser();
  });

  socket.on('disconnect', () => {
    console.log(`Lecsatlakozott: ${socket.id}`);
    if (waitingUser && waitingUser.id === socket.id) {
      waitingUser = null;
    } else if (socket.room) {
      socket.to(socket.room).emit('partner-left');
    }
  });
});

http.listen(3000, () => {
  console.log('Szerver fut a 3000-es porton');
});
