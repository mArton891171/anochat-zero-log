const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let queue = [];
let users = {};

function getRandomName() {
    return 'Anon' + Math.floor(1000 + Math.random() * 9000);
}

function updateOnlineCount() {
    const count = io.engine.clientsCount;
    io.emit('onlineCount', count);
}

io.on('connection', (socket) => {
    socket.username = getRandomName();
    updateOnlineCount();

    function findPartner() {
        if (queue.length > 0) {
            const partner = queue.shift();
            const room = socket.id + '#' + partner.id;

            socket.join(room);
            partner.join(room);

            users[socket.id] = partner.id;
            users[partner.id] = socket.id;

            socket.emit('partnerFound', { room, partnerName: partner.username });
            partner.emit('partnerFound', { room, partnerName: socket.username });
        } else {
            queue.push(socket);
            socket.emit('waiting');
        }
    }

    findPartner();

    const blockedDomains = ["grabify.io", "iplogger.org", "bit.ly","tinyurl.com", "bit.do", "adf.ly", "shorte.st", "linkvertise.com", "linkshrink.net", "linktr.ee", "linktree.com", "t.co", "tiny.cc", "is.gd", "v.ht", "rebrandly.com", "cutt.ly", "cuturl.net", "shorturl.at", "shortlink.co", "short.io", "shorte.st", "shrinkme.io", "shrinkme.link"];
    const lowerMsg = msg.toLowerCase();
    let flagged = false;
    
    for (const domain of blockedDomains) {
      if (lowerMsg.includes(domain)) {
        flagged = true;
        break;
      }
    }
    
    let cleanMsg = msg.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    
    if (flagged) {
      cleanMsg += " ⚠️ <i>(🪧)</i>";
    }
    
    socket.to(room).emit('message', {
      user: socket.username,
      msg: cleanMsg,
      time: now
    });
    

    socket.on('newPartner', () => {
        const currentPartnerId = users[socket.id];
        if (currentPartnerId) {
            const currentPartner = io.sockets.sockets.get(currentPartnerId);
            if (currentPartner) {
                currentPartner.emit('partnerLeft');
                queue.push(currentPartner);
            }
        }
        delete users[socket.id];
        findPartner();
    });

    socket.on('disconnect', () => {
        const partnerId = users[socket.id];
        if (partnerId) {
            const partner = io.sockets.sockets.get(partnerId);
            if (partner) {
                partner.emit('partnerLeft');
                delete users[partner.id];
            }
        }
        delete users[socket.id];
        queue = queue.filter(s => s.id !== socket.id);
        updateOnlineCount();
    });
});

app.use(express.static('public'));

server.listen(3000, () => {
    console.log('AnoChat fut: http://localhost:3000');
});
