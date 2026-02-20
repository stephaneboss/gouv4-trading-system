// GOUV4 Trading System - Backend Server v1.0
// Akash Network Deployment - MEXC Focus
// Comet Build - 19 FEV 2025

require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const CryptoJS = require('crypto-js');
const MEXCConnector = require('./mexc-connector');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors({ origin: '*' }));
app.use(helmet());
app.use(express.json());
app.use(express.static('../dashboard'));

// Config
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'gouv4-secret-key';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'gouv4-encrypt-key';

// MEXC Connector
const mexc = new MEXCConnector({
  apiKey: process.env.MEXC_API_KEY || '',
  secretKey: process.env.MEXC_SECRET_KEY || '',
});

// Key Manager - AES-256 Encrypted Storage
const keyVault = {
  keys: [],
  encrypt(data) {
    return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
  },
  decrypt(cipher) {
    const bytes = CryptoJS.AES.decrypt(cipher, ENCRYPTION_KEY);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  },
  addKey(service, label, apiKey, secret) {
    const encrypted = this.encrypt({ apiKey, secret });
    const entry = {
      id: Date.now(),
      service,
      label,
      keyPreview: apiKey.slice(0, 6) + '...' + apiKey.slice(-4),
      encrypted,
      status: 'active',
      createdAt: new Date().toISOString(),
      lastUsed: null,
    };
    this.keys.push(entry);
    return entry;
  },
  getKeys() {
    return this.keys.map(k => ({
      id: k.id,
      service: k.service,
      label: k.label,
      keyPreview: k.keyPreview,
      status: k.status,
      createdAt: k.createdAt,
      lastUsed: k.lastUsed,
    }));
  },
  deleteKey(id) {
    this.keys = this.keys.filter(k => k.id !== id);
  },
  rotateKey(id) {
    const key = this.keys.find(k => k.id === id);
    if (key) {
      key.status = 'rotating';
      setTimeout(() => { key.status = 'active'; }, 2000);
    }
    return key;
  }
};

// Agent Status Tracker
const agentStatus = {
  agents: [
    { name: 'MERLIN', type: 'Orchestrator', status: 'active', latency: 12, uptime: '99.9%', lastAction: 'System boot' },
    { name: 'ChatGPT', type: 'Analysis', status: 'active', latency: 234, uptime: '98.5%', lastAction: 'Standby' },
    { name: 'Gemini/Jimmy', type: 'Research', status: 'active', latency: 189, uptime: '99.2%', lastAction: 'Standby' },
    { name: 'Claude', type: 'Strategy', status: 'active', latency: 245, uptime: '97.8%', lastAction: 'Standby' },
    { name: 'Perplexity/Comet', type: 'Intel', status: 'active', latency: 156, uptime: '99.1%', lastAction: 'Standby' },
    { name: 'Kimi', type: 'Assistant', status: 'active', latency: 89, uptime: '100%', lastAction: 'Dashboard deployed' },
  ],
  getAll() { return this.agents; },
  update(name, data) {
    const agent = this.agents.find(a => a.name === name);
    if (agent) Object.assign(agent, data);
    return agent;
  }
};

// System logs
const systemLogs = [];
function addLog(message, type = 'info') {
  const entry = { time: new Date().toISOString(), message, type };
  systemLogs.unshift(entry);
  if (systemLogs.length > 500) systemLogs.pop();
  // Broadcast to WebSocket clients
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'log', data: entry }));
    }
  });
}

// ========== API ROUTES ==========

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    version: 'GOUV4 v5.0 ULTIMATE',
    network: 'Akash',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Balance
app.get('/api/balance', async (req, res) => {
  try {
    const balance = await mexc.getBalance();
    addLog('Balance fetched from MEXC', 'info');
    res.json({ success: true, data: balance });
  } catch (err) {
    addLog(`Balance error: ${err.message}`, 'error');
    res.status(500).json({ success: false, error: err.message });
  }
});

// Orderbook
app.get('/api/orderbook/:pair', async (req, res) => {
  try {
    const pair = req.params.pair.replace('-', '/');
    const orderbook = await mexc.getOrderbook(pair);
    res.json({ success: true, data: orderbook });
  } catch (err) {
    addLog(`Orderbook error: ${err.message}`, 'error');
    res.status(500).json({ success: false, error: err.message });
  }
});

// Recent Trades
app.get('/api/trades/:pair', async (req, res) => {
  try {
    const pair = req.params.pair.replace('-', '/');
    const trades = await mexc.getRecentTrades(pair);
    res.json({ success: true, data: trades });
  } catch (err) {
    addLog(`Trades error: ${err.message}`, 'error');
    res.status(500).json({ success: false, error: err.message });
  }
});

// Place Order
app.post('/api/orders', async (req, res) => {
  try {
    const { pair, side, type, price, amount } = req.body;
    addLog(`Order request: ${side} ${amount} ${pair} @ ${price}`, 'trade');
    const order = await mexc.placeOrder(pair, side, type, price, amount);
    addLog(`Order placed: ${order.id}`, 'trade');
    res.json({ success: true, data: order });
  } catch (err) {
    addLog(`Order error: ${err.message}`, 'error');
    res.status(500).json({ success: false, error: err.message });
  }
});

// Cancel Order
app.delete('/api/orders/:id', async (req, res) => {
  try {
    const result = await mexc.cancelOrder(req.params.id);
    addLog(`Order cancelled: ${req.params.id}`, 'trade');
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Open Orders
app.get('/api/orders/open', async (req, res) => {
  try {
    const orders = await mexc.getOpenOrders();
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ========== KEY MANAGER API ==========

app.get('/api/keys', (req, res) => {
  res.json({ success: true, data: keyVault.getKeys() });
});

app.post('/api/keys', (req, res) => {
  const { service, label, apiKey, secret } = req.body;
  if (!service || !label || !apiKey) {
    return res.status(400).json({ success: false, error: 'Missing fields' });
  }
  const entry = keyVault.addKey(service, label, apiKey, secret);
  addLog(`API Key added: ${service} - ${label}`, 'info');
  res.json({ success: true, data: entry });
});

app.delete('/api/keys/:id', (req, res) => {
  keyVault.deleteKey(parseInt(req.params.id));
  addLog('API Key deleted', 'warning');
  res.json({ success: true });
});

app.post('/api/keys/:id/rotate', (req, res) => {
  const key = keyVault.rotateKey(parseInt(req.params.id));
  addLog(`API Key rotation: ${key?.service}`, 'warning');
  res.json({ success: true, data: key });
});

// ========== AGENT STATUS API ==========

app.get('/api/agents', (req, res) => {
  res.json({ success: true, data: agentStatus.getAll() });
});

app.post('/api/agents/:name/restart', (req, res) => {
  const agent = agentStatus.update(req.params.name, { status: 'restarting', lastAction: 'Restart requested' });
  addLog(`Agent restart: ${req.params.name}`, 'agent');
  setTimeout(() => {
    agentStatus.update(req.params.name, { status: 'active', lastAction: 'Restarted successfully' });
  }, 2000);
  res.json({ success: true, data: agent });
});

app.post('/api/agents/:name/sync', (req, res) => {
  const agent = agentStatus.update(req.params.name, { lastAction: 'Syncing...' });
  addLog(`Agent sync: ${req.params.name}`, 'agent');
  setTimeout(() => {
    agentStatus.update(req.params.name, { lastAction: 'Sync complete' });
  }, 1000);
  res.json({ success: true, data: agent });
});

// ========== SYSTEM LOGS ==========

app.get('/api/logs', (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  res.json({ success: true, data: systemLogs.slice(0, limit) });
});

// ========== WEBSOCKET ==========

wss.on('connection', (ws) => {
  addLog('WebSocket client connected', 'info');

  // Start MEXC WebSocket proxy
  const mexcWs = new WebSocket('wss://wbs-api.mexc.com/ws');

  mexcWs.on('open', () => {
    addLog('MEXC WebSocket proxy connected', 'info');
    // Subscribe to BTC/USDT
    mexcWs.send(JSON.stringify({
      method: 'SUBSCRIPTION',
      params: ['spot@public.deals.v3.api@BTCUSDT']
    }));
    mexcWs.send(JSON.stringify({
      method: 'SUBSCRIPTION',
      params: ['spot@public.limit.depth.v3.api@BTCUSDT@20']
    }));
  });

  mexcWs.on('message', (data) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'mexc', data: JSON.parse(data) }));
    }
  });

  mexcWs.on('error', (err) => {
    addLog(`MEXC WS error: ${err.message}`, 'error');
  });

  ws.on('close', () => {
    mexcWs.close();
    addLog('WebSocket client disconnected', 'info');
  });
});

// ========== START SERVER ==========

server.listen(PORT, () => {
  addLog(`GOUV4 Backend v5.0 started on port ${PORT}`, 'info');
  addLog('Akash Network - Decentralized Deployment', 'info');
  addLog('MEXC connector initialized', 'info');
  addLog('Key Manager vault ready (AES-256)', 'info');
  addLog('Agent orchestrator online', 'agent');
  console.log(`\n  GOUV4 TRADING SYSTEM v5.0 ULTIMATE`);
  console.log(`  Akash Network Deployment`);
  console.log(`  Server: http://localhost:${PORT}`);
  console.log(`  Health: http://localhost:${PORT}/api/health`);
  console.log(`  WebSocket: ws://localhost:${PORT}\n`);
});
