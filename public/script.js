const socket = io();
const form = document.getElementById('chat-form');
const messageInput = document.getElementById('message');
const chatBox = document.getElementById('chat-box');
const status = document.getElementById('status');

let room = '';

socket.on('waiting', () => {
  status.innerText = 'Várakozás egy partnerre...';
});

socket.on('paired', data => {
  room = data.room;
  status.innerText = 'Partner csatlakozott. Kezdődhet a beszélgetés.';
  form.classList.remove('hidden');
});

socket.on('message', msg => {
  const div = document.createElement('div');
  div.classList.add('message', 'partner');
  div.innerText = msg;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
});

socket.on('partner-left', () => {
  const div = document.createElement('div');
  div.classList.add('message');
  div.innerText = 'A partnered lecsatlakozott.';
  chatBox.appendChild(div);
  status.innerText = 'A partner kilépett.';
  form.classList.add('hidden');
});

form.addEventListener('submit', e => {
  e.preventDefault();
  const msg = messageInput.value;
  socket.emit('message', { room, msg });

  const div = document.createElement('div');
  div.classList.add('message');
  div.innerText = msg;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;

  messageInput.value = '';
});
