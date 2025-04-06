const socket = io();
const form = document.getElementById('chat-form');
const messageInput = document.getElementById('message');
const chatBox = document.getElementById('chat-box');
const status = document.getElementById('status');
const nickname = document.getElementById('nickname');
const newPartnerBtn = document.getElementById('new-partner');

let room = '';
const myName = generateNickname();
nickname.innerText = `Te: ${myName}`;

function generateNickname() {
  const colors = ['Kék', 'Zöld', 'Piros', 'Narancs', 'Lila'];
  const animals = ['Róka', 'Teknős', 'Bagoly', 'Nyúl', 'Oroszlán'];
  return colors[Math.floor(Math.random() * colors.length)] + ' ' + animals[Math.floor(Math.random() * animals.length)];
}

socket.on('waiting', () => {
  status.innerText = 'Várakozás egy partnerre...';
});

socket.on('paired', data => {
  room = data.room;
  status.innerText = 'Partner csatlakozott. Kezdhetitek a beszélgetést.';
  form.classList.remove('hidden');
  newPartnerBtn.classList.remove('hidden');
  chatBox.innerHTML = '';
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
  const msg = `${myName}: ${messageInput.value}`;
  socket.emit('message', { room, msg });

  const div = document.createElement('div');
  div.classList.add('message');
  div.innerText = msg;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;

  messageInput.value = '';
});

newPartnerBtn.addEventListener('click', () => {
  socket.emit('search-new');
  status.innerText = 'Új partner keresése...';
  chatBox.innerHTML = '';
  form.classList.add('hidden');
});
