## Why

Messages from group chats arrive with raw `@lid` identifiers (e.g. `168835315405013@lid`) instead of display names, making summaries unreadable. Resolving these to contact names at the bridge layer fixes this for every consumer (MCP tools, future clients) without each having to do it independently.

## What Changes

- Extend `GET /chats/:chat_id/messages` to include a `sender_name` field resolved via `waClient.getContactById()`
- Add `GET /contacts/:contact_id` endpoint for on-demand single contact lookup
- Add `GET /contacts/resolve` batch endpoint accepting an array of `@lid` IDs and returning a `{id: name}` map

## Capabilities

### New Capabilities

- `contact-resolution`: Resolve WhatsApp `@lid` identifiers to human-readable display names via the bridge

### Modified Capabilities

## Impact

- `wa-bridge/index.js`: new Express routes, `getContactById` calls added to message fetch path
- `mcp-server/server.py`: `get_messages` tool output improves automatically (sender_name field)
- No new npm dependencies required
