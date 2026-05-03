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

async function resolveContactName(id) {
  try {
    const contact = await waClient.getContactById(id);
    return contact.name ?? contact.pushname ?? id;
  } catch (_) {
    return id;
  }
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

async function buildMessageResult(messages, contextCount) {
  const uniqueSenderIds = [...new Set(
    messages.filter((m) => !m.fromMe).map((m) => m.author ?? m.from)
  )];
  const nameMap = Object.fromEntries(
    await Promise.allSettled(uniqueSenderIds.map((id) => resolveContactName(id)))
      .then((results) => results.map((r, i) => [uniqueSenderIds[i], r.status === 'fulfilled' ? r.value : uniqueSenderIds[i]]))
  );
  return messages.map((m, i) => {
    const senderId = m.author ?? m.from;
    const entry = {
      id: m.id._serialized,
      from: senderId,
      sender_name: m.fromMe ? 'You' : (nameMap[senderId] ?? senderId),
      body: m.body,
      timestamp: m.timestamp,
      is_from_me: m.fromMe,
    };
    if (contextCount !== undefined) {
      entry.is_context = i < contextCount;
    }
    return entry;
  });
}

app.get('/chats/:chat_id/messages', async (req, res) => {
  if (!clientReady) return notReady(res);
  const limit = Math.min(parseInt(req.query.limit ?? '20', 10), 100);
  const contextParam = req.query.context;
  const context = contextParam !== undefined ? Math.max(0, parseInt(contextParam, 10)) : undefined;
  try {
    const chat = await findChat(req.params.chat_id);
    if (!chat) return res.status(404).json({ error: 'chat_not_found' });
    const fetchLimit = context !== undefined ? limit + context : limit;
    const messages = await chat.fetchMessages({ limit: fetchLimit });
    const result = await buildMessageResult(messages, context !== undefined ? Math.max(0, messages.length - limit) : undefined);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/chats/:chat_id/unread', async (req, res) => {
  if (!clientReady) return notReady(res);
  const contextParam = req.query.context;
  const context = contextParam !== undefined ? Math.max(0, parseInt(contextParam, 10)) : 0;
  try {
    const chat = await findChat(req.params.chat_id);
    if (!chat) return res.status(404).json({ error: 'chat_not_found' });
    const unreadCount = chat.unreadCount ?? 0;
    if (unreadCount === 0) return res.json([]);
    const messages = await chat.fetchMessages({ limit: unreadCount + context });
    const actualContext = Math.max(0, messages.length - unreadCount);
    const result = await buildMessageResult(messages, actualContext);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/contacts/resolve', async (req, res) => {
  if (!clientReady) return notReady(res);
  const raw = req.query.ids ?? '';
  const ids = raw.split(',').map((s) => s.trim()).filter(Boolean);
  if (ids.length === 0) return res.status(400).json({ error: 'ids_required' });
  if (ids.length > 50) return res.status(400).json({ error: 'too_many_ids', max: 50 });
  try {
    const results = await Promise.allSettled(ids.map((id) => resolveContactName(id)));
    const nameMap = Object.fromEntries(
      results.flatMap((r, i) => r.status === 'fulfilled' ? [[ids[i], r.value]] : [])
    );
    res.json(nameMap);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/contacts/:contact_id', async (req, res) => {
  if (!clientReady) return notReady(res);
  try {
    const contact = await waClient.getContactById(req.params.contact_id);
    if (!contact) return res.status(404).json({ error: 'contact_not_found' });
    res.json({
      id: contact.id._serialized,
      name: contact.name ?? contact.pushname ?? null,
      number: contact.number ?? null,
    });
  } catch (_) {
    res.status(404).json({ error: 'contact_not_found' });
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
