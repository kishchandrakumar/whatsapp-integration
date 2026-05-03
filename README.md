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

## Available tools in Claude Code

| Tool | Description |
|---|---|
| `list_chats` | List recent chats, optionally filter by name |
| `get_messages` | Fetch recent messages from a chat |
| `send_message` | Send a text message to a chat |

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
