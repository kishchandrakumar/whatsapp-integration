# WhatsApp Integration for Claude Code

Gives Claude Code access to WhatsApp — read messages, list chats, send text — via a local Node.js bridge and a Python MCP server.

## Architecture

```
Claude Code (MCP client)
    │
    ▼
mcp-server/server.py  (Python, stdio MCP server)
    │  HTTP on localhost:3456
    ▼
wa-bridge/index.js  (Node.js, Express + whatsapp-web.js + Puppeteer)
    │  WebSocket
    ▼
WhatsApp Web
```

I chose `whatsapp-web.js` over Baileys because it abstracts the full session handshake and message decoding at the cost of a Chromium dependency. See [docs/decisions/001-whatsapp-web-js-over-baileys.md](docs/decisions/001-whatsapp-web-js-over-baileys.md).

## Prerequisites

| Requirement | Check |
|---|---|
| Node.js ≥ 18 | `node --version` |
| npm | `npm --version` |
| Python 3.12+ | `python3 --version` |

Puppeteer downloads Chromium automatically on `npm install`. If it fails on a headless server, install system Chromium: `sudo apt install chromium-browser`.

## Setup (one-time)

```bash
# 1. Install Node.js bridge deps
cd wa-bridge && npm install

# 2. Install Python MCP server deps
cd ../mcp-server && python3 -m venv .venv && .venv/bin/pip install mcp httpx
```

## Starting the services

**Terminal 1 — WhatsApp bridge:**
```bash
cd wa-bridge && npm start
```

On first run, a QR code appears. Open WhatsApp on your phone → Linked Devices → Link a device → scan the QR. Wait for `CLIENT_READY` in the log.

**The MCP server** is started automatically by Claude Code when you open a session in this project (registered in `.claude/settings.json`). Run it manually only for debugging:
```bash
cd mcp-server && .venv/bin/python3 server.py
```

## Session persistence

Credentials are saved to `.wwebjs_auth/` (gitignored) after the first QR scan. Subsequent restarts reconnect automatically.

If WhatsApp revokes the session (phone offline for days, or manually unlinked from Linked Devices), delete `.wwebjs_auth/` and re-scan.

## Registering the MCP server with Claude Code

Once the bridge is running and you've scanned the QR code, register the MCP server so Claude Code can use it from any project.

**Option A — global (available in every Claude Code session):**
```bash
claude mcp add whatsapp \
  --scope user \
  -- /absolute/path/to/whatsapp-integration/mcp-server/.venv/bin/python3 \
     /absolute/path/to/whatsapp-integration/mcp-server/server.py
```

**Option B — project-local (only in this directory):**
```bash
claude mcp add whatsapp \
  -- /absolute/path/to/whatsapp-integration/mcp-server/.venv/bin/python3 \
     /absolute/path/to/whatsapp-integration/mcp-server/server.py
```

Replace `/absolute/path/to/whatsapp-integration` with the real path on your machine (e.g. `/home/yourname/projects/whatsapp-integration`).

Verify it registered:
```bash
claude mcp list
```

The MCP server is a stdio process — Claude Code starts and stops it automatically per session.

## Available tools in Claude Code

| Tool | Description |
|---|---|
| `list_chats` | List recent chats, optionally filter by name |
| `get_messages` | Fetch recent messages from a chat |
| `send_message` | Send a text message to a chat |
| `summarise_unread` | Fetch all unread messages across every chat, with context for pronoun resolution |

### Sending messages

When calling `send_message` or hitting the bridge directly, the body field must be `text`:

```json
POST /chats/{chat_id}/send
{"text": "your message here"}
```

Not `message`, not `body` — `text`.

### Summarising unread messages

The `summarise_unread` tool returns both context messages (up to 10 prior messages per chat) and the unread messages themselves. Always read the context before summarising — it establishes who "you", "he", "they" refer to in the unread portion.

If you're configuring Claude via a `CLAUDE.md`, add this rule:

> When summarising unread messages, always read context messages first to resolve pronouns and topic continuations. The summary should cover unread content only, but context must be read before writing it.

## How name resolution works

Every message in the bridge carries a raw sender ID (e.g. `447911123456@c.us`). Before returning messages to Claude, the MCP server resolves these to human-readable names in two steps:

1. **Your messages** — any message where `is_from_me: true` is labelled `"You"` regardless of the sender ID.
2. **Other senders** — all other unique IDs are sent in a single batch to `GET /contacts/resolve?ids=id1,id2,...`. The bridge calls WhatsApp's own contact store for each ID, preferring:
   - Your **saved contact name** (e.g. "Amar") — what you've named them in your phone
   - Their **push name** (their own WhatsApp display name) — fallback if you haven't saved them
   - The **raw ID** — last resort if lookup fails

Resolution is done before any message is shown to Claude, so every line in a summary is already labelled with a real name. This is also why context messages must be read — if an unread message says "what did you think of that?", the context line showing who sent the previous message is what lets Claude know who "you" refers to.

## Sample Claude prompts

### Summarising

```
Summarise unread in [chat name]
```
```
What's new in Family chat?
```
```
Summarise all unread WhatsApp messages
```
```
Any unread in the work group?
```

### Replying

```
Reply to [chat name] saying I'll be there at 7
```
```
Send a message to Amar on WhatsApp: "sounds good, see you then"
```
```
Tell the family group I'm on my way
```

### Finding a chat

```
Search WhatsApp for a chat called "tennis"
```
```
List my recent WhatsApp chats
```

## Stopping the bridge

```bash
# In the bridge terminal
Ctrl+C

# Or by port
kill $(lsof -ti:3456)
```

## Known risks

**WhatsApp Terms of Service**: This uses the unofficial WhatsApp Web protocol. Use it as a personal productivity tool — not for bulk messaging — to minimise risk of account suspension.

**Session expiry**: Sessions expire if your phone is offline for extended periods or if you revoke the linked device. Fix: delete `.wwebjs_auth/` and re-scan.

**`whatsapp-web.js` breakage**: WhatsApp periodically changes its Web protocol. Fix: `npm update whatsapp-web.js` inside `wa-bridge/`.

**Chromium memory**: Puppeteer keeps a full Chromium process running (~150–300MB RAM). Stop the bridge when not in use.
