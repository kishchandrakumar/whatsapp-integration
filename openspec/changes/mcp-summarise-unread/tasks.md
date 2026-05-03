## 1. Implement summarise_unread tool

- [x] 1.1 Import `build_speaker_map` from `speaker_map` in `mcp-server/server.py`
- [x] 1.2 Register `summarise_unread` tool in `list_tools()` with description and empty `inputSchema`
- [x] 1.3 In `call_tool`, implement `summarise_unread` handler:
  - Fetch all chats via `GET /chats`
  - Filter to `unread_count > 0`
  - Return "No unread messages." if none
- [x] 1.4 For each unread chat, fetch via `GET /chats/:id/unread?context=10&limit=50`
- [x] 1.5 Build speaker map for all messages in each chat via `build_speaker_map`
- [x] 1.6 Format each chat block: header `[Chat: <name>]`, then lines `[timestamp] [context] SenderName: body` or `[timestamp] SenderName: body`
- [x] 1.7 When `unread_count > 50`, note "50 of N unread messages shown" in the chat block header
- [x] 1.8 Join all chat blocks and return as single `TextContent`

## 2. Manual test

- [ ] 2.1 Restart MCP server, ask Claude "summarise my unread WhatsApp messages" in a Claude Code session
- [ ] 2.2 Verify all unread chats appear with readable speaker names and correct context/unread split

## 3. Commit

- [ ] 3.1 Commit changes to `mcp-server/server.py` with message `feat: add summarise_unread MCP tool`
