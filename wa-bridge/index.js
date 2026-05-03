'use strict';

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');

const PORT = 3456;
const app = express();
app.use(express.json());

let clientReady = false;
let waClient;

waClient = new Client({
  authStrategy: new LocalAuth({ dataPath: '.wwebjs_auth' }),
  puppeteer: {
    headless: true,
    protocolTimeout: 120000,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  },
});

waClient.on('qr', (qr) => {
  console.log('Scan this QR code with WhatsApp on your phone:');
  qrcode.generate(qr, { small: true });
});

waClient.on('ready', () => {
  clientReady = true;
  console.log('CLIENT_READY');
});

waClient.on('auth_failure', (msg) => {
  console.error('AUTH_FAILURE', msg);
  process.exit(1);
});

waClient.on('disconnected', (reason) => {
  console.warn('DISCONNECTED', reason);
  clientReady = false;
});

// --- helpers ---

function notReady(res) {
  res.status(503).json({ error: 'client_not_ready' });
}

async function findChat(chatId) {
  const chats = await waClient.getChats();
  return chats.find((c) => c.id._serialized === chatId) ?? null;
}

// --- routes ---

app.get('/status', (_req, res) => {
  res.json({ status: clientReady ? 'ready' : 'initialising' });
});

app.get('/chats', async (req, res) => {
  if (!clientReady) return notReady(res);
  try {
    let chats = await waClient.getChats();
    const search = req.query.search?.toLowerCase();
    if (search) {
      chats = chats.filter((c) => c.name.toLowerCase().includes(search));
    }
    const result = chats.slice(0, 50).map((c) => ({
      id: c.id._serialized,
      name: c.name,
      last_message: c.lastMessage?.body ?? null,
      unread_count: c.unreadCount,
      is_group: c.isGroup,
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/chats/:chat_id/messages', async (req, res) => {
  if (!clientReady) return notReady(res);
  const limit = Math.min(parseInt(req.query.limit ?? '20', 10), 100);
  try {
    const chat = await findChat(req.params.chat_id);
    if (!chat) return res.status(404).json({ error: 'chat_not_found' });
    const messages = await chat.fetchMessages({ limit });
    const result = messages.map((m) => ({
      id: m.id._serialized,
      from: m.author ?? m.from,
      body: m.body,
      timestamp: m.timestamp,
      is_from_me: m.fromMe,
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/chats/:chat_id/send', async (req, res) => {
  if (!clientReady) return notReady(res);
  const text = req.body?.text?.trim();
  if (!text) return res.status(400).json({ error: 'empty_message' });
  try {
    const chat = await findChat(req.params.chat_id);
    if (!chat) return res.status(404).json({ error: 'chat_not_found' });
    const msg = await chat.sendMessage(text);
    res.json({ status: 'sent', message_id: msg.id._serialized });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- shutdown ---

async function shutdown() {
  console.log('Shutting down...');
  try {
    await waClient.destroy();
  } catch (_) {}
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// --- start ---

app.listen(PORT, () => {
  console.log(`wa-bridge listening on http://localhost:${PORT}`);
});

waClient.initialize();
