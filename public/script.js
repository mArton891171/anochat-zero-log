const themes = {
    dark: `
      body { background-color: #0d0d0d; color: #e0e0e0; }
      input { background-color: #2e2e2e; color: #fff; }
      button { background-color: #00ffcc; color: #000; }
      button:hover { background-color: #00ccaa; }
      .me { color: #00bfff; }
      .partner { color: #ff66cc; }
    `,
    light: `
      body { background-color: #f2f2f2; color: #222; }
      input { background-color: #fff; color: #000; }
      button { background-color: #333; color: #fff; }
      button:hover { background-color: #000; }
      .me { color: #007acc; }
      .partner { color: #cc007a; }
    `
  };
  
  function applyTheme(theme) {
    document.getElementById('theme-style')?.remove();
    const style = document.createElement('style');
    style.id = 'theme-style';
    style.textContent = themes[theme];
    document.head.appendChild(style);
  
    localStorage.setItem('anochat-theme', theme);
    document.getElementById('themeBtn').innerText = theme === 'dark' ? 'Világos mód' : 'Sötét mód';
  }
  
  function toggleTheme() {
    const current = localStorage.getItem('anochat-theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  }
  
  function acceptDisclaimer() {
    localStorage.setItem('anochat_disclaimer_accepted', 'true');
    document.getElementById('disclaimerModal').style.display = 'none';
  }
  
  window.addEventListener('load', () => {
    applyTheme(localStorage.getItem('anochat-theme') || 'dark');
    if (localStorage.getItem('anochat_disclaimer_accepted') !== 'true') {
      document.getElementById('disclaimerModal').style.display = 'flex';
      document.getElementById('chat').style.display = 'none';
    } else {
      document.getElementById('disclaimerModal').style.display = 'none';
    }
  });
  
  const socket = io();
  let room = null;
  let canSend = true;
  let partnerName = '';
  
  const messagesDiv = document.getElementById('messages');
  const statusDiv = document.getElementById('status');
  const input = document.getElementById('msgInput');
  const onlineDiv = document.getElementById('online');
  
  socket.on('waiting', () => {
    statusDiv.innerText = 'Várakozás partnerre...';
  });
  
  socket.on('partnerFound', (data) => {
    room = data.room;
    partnerName = data.partnerName;
    statusDiv.style.display = 'none';
    document.getElementById('chat').style.display = 'block';
    messagesDiv.innerHTML = `<div class="msg"><i>Beszélgetés indult ${partnerName}-val.</i></div>`;
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
  