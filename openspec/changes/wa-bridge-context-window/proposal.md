## Why

The `summarise_unread` flow needs unread messages plus a few messages before them for context (so Claude understands what the unread messages are responding to). Currently callers can only fetch the last N messages with no way to express "give me the unread window plus K messages of prior context", forcing over-fetching or losing conversational coherence.

## What Changes

- Add `?context=N` query parameter to `GET /chats/:chat_id/messages` — fetches N additional messages before the unread window
- Add `GET /chats/:chat_id/unread` endpoint that returns only unread messages with optional context prepended

## Capabilities

### New Capabilities

- `message-context-window`: Fetch unread messages with a configurable number of prior-context messages in a single request

### Modified Capabilities

## Impact

- `wa-bridge/index.js`: extended query param handling on existing messages route, new `/unread` route
- `mcp-server/server.py`: `get_messages` and future `summarise_unread` tool benefit without interface changes
- No new npm dependencies
