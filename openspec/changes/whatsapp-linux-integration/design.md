## Context

Claude Code runs on an Ubuntu Linux desktop. There is no native WhatsApp Linux app. WhatsApp is accessible via WhatsApp Web (browser), which uses a WebSocket-based protocol. The `whatsapp-web.js` library reverse-engineers this protocol via a headless Chromium/Puppeteer session, making it the most practical path to programmatic WhatsApp access on Linux without violating the protocol directly.

The integration needs to fit Claude Code's MCP tool-call model: Claude invokes named tools, gets back structured results, and can chain calls. The WhatsApp client must therefore be always-on (not spawned per call) and expose a stable interface.

## Goals / Non-Goals

**Goals:**
- Read messages from individual and group chats
- Send text messages to individuals and groups
- List available chats with unread counts
- Persist WhatsApp Web session across restarts (no QR re-scan each time)
- Register as an MCP server so Claude Code can call WhatsApp tools natively

**Non-Goals:**
- Media sending/receiving (images, voice notes, documents) — text only for v1
- WhatsApp Business API integration (cloud-hosted, different protocol)
- Multi-device or multi-account support
- Running as a system service / daemon — manual start is acceptable for v1

## Decisions

### D1: Use `whatsapp-web.js` over direct protocol implementation

`whatsapp-web.js` is the most mature Node.js library for WhatsApp Web automation. Alternatives considered:
- **Baileys** (multi-device WA protocol implementation): more direct but lower-level, requires maintaining proto definitions
- **Browser Playwright scripting**: fragile — DOM changes break it; no persistent message stream

`whatsapp-web.js` abstracts the WebSocket handshake, session keys, and message decoding. It has active maintenance and a large community. Tradeoff: adds Puppeteer/Chromium dependency (~300MB).

### D2: Thin HTTP bridge between Node.js client and Python MCP server

The MCP server Claude Code talks to will be Python (consistent with the rest of the tooling). It communicates with the Node.js `whatsapp-web.js` process over a local HTTP API (Express) on `localhost:3456`.

Alternatives considered:
- **MCP server written in Node.js directly**: possible, but Claude Code MCP ecosystem examples and Kishan's fluency are Python-first
- **Stdin/stdout IPC**: simpler but harder to debug and no concurrent request support

The HTTP bridge is easy to test independently with `curl` and decouples the WA client lifecycle from the MCP server lifecycle.

### D3: Session persistence via LocalAuth strategy

`whatsapp-web.js` supports `LocalAuth` which saves session credentials to a local `.wwebjs_auth/` directory. On restart the library re-uses these credentials without re-scanning the QR code, provided the WhatsApp session has not expired on the phone side.

### D4: MCP server registered in project `.claude/settings.json`

The MCP server is scoped to this project, not globally. This avoids interfering with other Claude Code projects and keeps the integration self-contained.

## Risks / Trade-offs

- **WhatsApp ToS**: Using unofficial automation may violate WhatsApp's Terms of Service and risk account suspension. → Mitigation: use the integration sparingly, avoid bulk messaging, treat it as a personal productivity tool not a bot platform.
- **Chromium resource usage**: Puppeteer keeps a full browser process running. → Mitigation: start the Node service only when needed; document how to stop it.
- **Session expiry**: WhatsApp Web sessions expire if the linked phone is offline for extended periods or if WA revokes the session. → Mitigation: the MCP server returns a clear `session_expired` error; the user re-runs the QR scan flow.
- **`whatsapp-web.js` breakage**: WhatsApp periodically changes the Web protocol, breaking the library until it is updated. → Mitigation: pin a known-working version; document how to update.
- **No message streaming**: MCP tool calls are request/response; Claude cannot receive push notifications for new messages. → Mitigation: Claude polls for new messages when needed via the `get_messages` tool.

## Migration Plan

1. Install Node.js dependencies and verify Chromium is available
2. Start the Node.js bridge service manually, scan QR code once
3. Start the Python MCP server
4. Register MCP server in `.claude/settings.json`
5. Test tool calls from a Claude Code session
6. Document start/stop procedure in README

Rollback: remove the MCP server entry from `.claude/settings.json`; no other system state is affected.

## Open Questions

- Should the Node.js service auto-restart on crash (via `pm2` or similar)? Defer to v2.
- Rate limiting: should the MCP server enforce a minimum delay between sends to avoid spam detection? Add as a configurable option.
