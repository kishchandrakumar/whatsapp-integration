# WhatsApp Integration — Claude Instructions

## Stack
- **wa-bridge**: Node.js (whatsapp-web.js), HTTP bridge on port 3456
- **mcp-server**: Python MCP server wrapping the bridge

## Sending messages

To send a message to a chat:
```
POST /chats/{chat_id}/send
{"text": "<message>"}
```
The field must be `text` — not `message` or `body`.

## Summarising WhatsApp chats

When summarising unread messages from a chat:

1. Always fetch context messages alongside unread messages (the `/unread` endpoint returns both).
2. Read context messages before summarising — do not filter them out. They establish who "you", "he", "she", "they" refer to in the unread portion.
3. The summary itself should cover the unread content only, but context must be read first to interpret pronouns and topic continuations correctly.
