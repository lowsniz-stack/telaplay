// Mapa de conexões ativas: screenToken -> Set<WebSocket>
const connections = new Map();

function setupWebSocket(wss) {
  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, 'ws://localhost');
    const token = url.searchParams.get('token');

    if (!token) {
      ws.close(1008, 'Token obrigatório');
      return;
    }

    // Registrar conexão por token
    if (!connections.has(token)) connections.set(token, new Set());
    connections.get(token).add(ws);

    console.log(`📺 Player conectado: ${token} (total: ${connections.get(token).size})`);

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'PING') ws.send(JSON.stringify({ type: 'PONG' }));
      } catch (_) {}
    });

    ws.on('close', () => {
      const set = connections.get(token);
      if (set) {
        set.delete(ws);
        if (set.size === 0) connections.delete(token);
      }
    });

    ws.on('error', (err) => console.error('WS error:', err.message));

    // Enviar confirmação de conexão
    ws.send(JSON.stringify({ type: 'CONNECTED', token }));
  });
}

// Broadcast para todos os players de uma tela (por screenId ou shareToken)
function broadcast(wss, screenIdentifier, message) {
  const payload = JSON.stringify(message);
  let sent = 0;

  for (const [token, clients] of connections.entries()) {
    if (token.includes(screenIdentifier) || screenIdentifier.includes(token)) {
      for (const client of clients) {
        if (client.readyState === 1) { // OPEN
          client.send(payload);
          sent++;
        }
      }
    }
  }

  // Também tenta pelo shareToken direto
  const direct = connections.get(screenIdentifier);
  if (direct) {
    for (const client of direct) {
      if (client.readyState === 1) {
        client.send(payload);
        sent++;
      }
    }
  }

  return sent;
}

// Broadcast global (para todos os players conectados)
function broadcastAll(message) {
  const payload = JSON.stringify(message);
  for (const clients of connections.values()) {
    for (const client of clients) {
      if (client.readyState === 1) client.send(payload);
    }
  }
}

function getConnectedCount() {
  let total = 0;
  for (const clients of connections.values()) total += clients.size;
  return total;
}

module.exports = { setupWebSocket, broadcast, broadcastAll, getConnectedCount };
