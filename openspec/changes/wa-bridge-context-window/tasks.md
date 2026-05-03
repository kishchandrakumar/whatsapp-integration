## 1. Add context param to existing messages route

- [ ] 1.1 Parse `?context=N` integer from query params in `GET /chats/:chat_id/messages`
- [ ] 1.2 When `context > 0`, fetch `limit + context` total messages; tag first `context` messages with `is_context: true`, remainder with `is_context: false`
- [ ] 1.3 When `context` is absent, omit `is_context` field entirely (backwards compatible)
- [ ] 1.4 Manual test: `curl "/chats/:id/messages?limit=5&context=3"` — verify 8 messages returned with correct `is_context` tagging

## 2. Add unread messages endpoint

- [ ] 2.1 Implement `GET /chats/:chat_id/unread` route: read `chat.unreadCount`, fetch `unreadCount + context` messages, split into context and unread windows
- [ ] 2.2 Return empty array when `unreadCount == 0`
- [ ] 2.3 Return HTTP 503 when client not ready
- [ ] 2.4 Manual test: `curl "/chats/:id/unread?context=5"` on a chat with unread messages — verify split is correct

## 3. Commit

- [ ] 3.1 Commit changes to `wa-bridge/index.js` with message `feat: add context window and unread endpoint to bridge`
