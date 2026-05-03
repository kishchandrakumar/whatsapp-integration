## Why

Claude running on this Linux environment has no way to read or send WhatsApp messages, limiting its usefulness for communication tasks. Integrating WhatsApp access gives Claude the ability to act on messages, draft replies, and surface relevant information directly from conversations.

## What Changes

- Introduce a WhatsApp client layer that connects to the WhatsApp Web API (via `whatsapp-web.js` or equivalent) running as a local service
- Expose message read, send, and list operations through a Python interface consumed by Claude
- Provide session persistence so the WhatsApp connection survives restarts without re-scanning QR code each time
- Wire the integration up as an MCP server so Claude can invoke it via tool calls

## Capabilities

### New Capabilities

- `whatsapp-session`: Manage WhatsApp Web session lifecycle — initialise, authenticate via QR code, persist session, and reconnect
- `whatsapp-messaging`: Read incoming messages, list chats, send text messages to individuals and groups
- `whatsapp-mcp-server`: Expose WhatsApp operations as MCP tools Claude can call within Claude Code sessions

### Modified Capabilities

## Impact

- New Node.js service (`whatsapp-web.js`) running locally as a background process
- New Python MCP server wrapping the Node service via HTTP or stdin/stdout
- Claude Code `settings.json` updated to register the new MCP server
- No external APIs or cloud services — all traffic goes through WhatsApp Web (same as the browser client)
- Dependency on Chromium/Puppeteer for WhatsApp Web automation
