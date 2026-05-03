## 1. Project Setup

- [x] 1.1 Initialise git repo, create `.gitignore` (node_modules, .wwebjs_auth, .env, __pycache__)
- [x] 1.2 Create project directory structure: `wa-bridge/` (Node.js), `mcp-server/` (Python), `docs/`
- [x] 1.3 Write `docs/decisions/001-whatsapp-web-js-over-baileys.md` ADR
- [x] 1.4 Write `docs/debugging.md` skeleton

## 2. Node.js WhatsApp Bridge

- [x] 2.1 Initialise `wa-bridge/package.json` with `whatsapp-web.js`, `express`, `qrcode-terminal`
- [x] 2.2 Implement `wa-bridge/index.js`: create `Client` with `LocalAuth`, handle `qr`, `ready`, `auth_failure` events
- [x] 2.3 Log `CLIENT_READY` to stdout when client emits `ready`
- [x] 2.4 Implement graceful shutdown on SIGTERM/SIGINT (close Puppeteer browser)
- [x] 2.5 Implement Express route `GET /status` returning `{"status": "ready"|"initialising"}`
- [x] 2.6 Implement Express route `GET /chats` with optional `?search=` query filter
- [x] 2.7 Implement Express route `GET /chats/:chat_id/messages?limit=N`
- [x] 2.8 Implement Express route `POST /chats/:chat_id/send` with `{"text": "..."}` body
- [x] 2.9 Add error handling for client-not-ready (HTTP 503) and chat-not-found (HTTP 404) across all routes
- [ ] 2.10 Manual test: start bridge, scan QR, verify `CLIENT_READY` log and all routes via `curl`

## 3. Session Persistence Verification

- [ ] 3.1 Restart the bridge after initial QR scan and confirm reconnection without QR prompt
- [x] 3.2 Document the `.wwebjs_auth/` directory location in README

## 4. Python MCP Server

- [x] 4.1 Initialise `mcp-server/` with `pyproject.toml` / `requirements.txt` — dependencies: `mcp`, `httpx`
- [x] 4.2 Implement `mcp-server/server.py` with MCP server boilerplate (stdio transport)
- [x] 4.3 Implement `list_chats` tool: calls `GET /chats`, formats output as readable text
- [x] 4.4 Implement `get_messages` tool: calls `GET /chats/{chat_id}/messages`, formats with sender/timestamp
- [x] 4.5 Implement `send_message` tool: validates inputs, calls `POST /chats/{chat_id}/send`, returns confirmation
- [x] 4.6 Add bridge-unavailable error handling in all tools (connection refused → user-friendly message)
- [x] 4.7 Manual test: run MCP server standalone, call tools via stdin JSON and verify responses

## 5. Claude Code Integration

- [x] 5.1 Create `.claude/settings.json` in project root with `mcpServers` entry pointing to `mcp-server/server.py`
- [ ] 5.2 Start both services and open a Claude Code session in this project
- [ ] 5.3 Verify `list_chats`, `get_messages`, and `send_message` tools are available and callable
- [ ] 5.4 Test golden path: list chats → get messages from one chat → send a test message

## 6. Documentation

- [x] 6.1 Write `README.md`: purpose, prerequisites (Node.js, Python, Chromium), start/stop procedure, QR scan instructions
- [x] 6.2 Document known risks (ToS, session expiry) in README
- [ ] 6.3 Commit initial working state with conventional commit messages
