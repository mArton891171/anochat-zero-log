function acceptDisclaimer() {
    localStorage.setItem('anochat_disclaimer_accepted', 'true');
    document.getElementById('disclaimerModal').style.display = 'none';
  }
  
  function applyTheme(theme) {
    document.getElementById('theme-style')?.remove();
    const style = document.createElement('style');
    style.id = 'theme-style';
    style.textContent = theme === 'dark' ? `
      body { background-color: #0d0d0d; color: #e0e0e0; }
      input, #messages { background-color: #2e2e2e; color: #fff; }
      button { background-color: #00ffcc; color: #000; }
    ` : `
      body { background-color: #ffffff; color: #000000; }
      input, #messages { background-color: #f0f0f0; color: #000; }
      button { background-color: #333; color: #fff; }
    `;
    document.head.appendChild(style);
    localStorage.setItem('anochat-theme', theme);
    document.getElementById('themeBtn').innerText = theme === 'dark' ? 'Világos mód' : 'Sötét mód';
  }
  
  function toggleTheme() {
    const current = localStorage.getItem('anochat-theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  }
  
  window.addEventListener('load', () => {
    applyTheme(localStorage.getItem('anochat-theme') || 'dark');
    if (localStorage.getItem('anochat_disclaimer_accepted') !== 'true') {
      document.getElementById('disclaimerModal').style.display = 'flex';
      document.getElementById('chat').style.display = 'none';
    }
  });
  
  const socket = io();
  let room = null;
  let canSend = true;
  
  const messagesDiv = document.getElementById('messages');
  const statusDiv = document.getElementById('status');
  const input = document.getElementById('msgInput');
  const onlineDiv = document.getElementById('online');
  
  socket.on('waiting', () => {
    statusDiv.innerText = 'Várakozás partnerre...';
  });
  
  socket.on('partnerFound', (data) => {
    room = data.room;
    document.getElementById("partnerName").innerText = `Partner: ${data.partnerName}`;
    statusDiv.style.display = 'none';
    document.getElementById('chat').style.display = 'block';
    messagesDiv.innerHTML = `<div class="msg"><i>Beszélgetés indult.</i></div>`;
  });
  
  socket.on('partnerLeft', () => {
    messagesDiv.innerHTML += `<div class="msg"><i>Partner kilépett.</i></div>`;
    statusDiv.innerText = 'Új partner keresése...';
    statusDiv.style.display = 'block';
    document.getElementById('chat').style.display = 'none';
  });
  
  socket.on('message', ({ user, msg, time }) => {
    messagesDiv.innerHTML += `<div class="msg partner"><b>${user}</b> [${time}]: ${msg}</div>`;
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
  
  socket.on('onlineCount', (count) => {
    onlineDiv.innerText = `Online: ${count}`;
  });
  
  function sendMessage() {
    const msg = input.value.trim();
    if (!msg || !canSend) return;
  
    if (msg.length > 300) {
      alert("Túl hosszú üzenet (max 300 karakter)");
      return;
    }
  
    const now = new Date().toLocaleTimeString();
    messagesDiv.innerHTML += `<div class="msg me"><b>Te</b> [${now}]: ${msg}</div>`;
    socket.emit('message', { room, msg });
    input.value = '';
    canSend = false;
    setTimeout(() => canSend = true, 1000);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }
  
  function newPartner() {
    socket.emit('newPartner');
    messagesDiv.innerHTML = `<div class="msg"><i>Új partner keresése...</i></div>`;
    statusDiv.innerText = 'Új partner keresése...';
    statusDiv.style.display = 'block';
    document.getElementById('chat').style.display = 'none';
  }
  
  input.addEventListener('keypress', e => {
    if (e.key === 'Enter') sendMessage();
  });
  