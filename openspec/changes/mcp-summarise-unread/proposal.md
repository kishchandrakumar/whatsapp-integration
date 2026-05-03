## Why

Reading unread group chats one-by-one is slow and requires multiple tool calls. A single `summarise_unread` tool that fetches all unread chats, resolves sender names, and returns a structured summary per chat lets Claude produce a full catch-up briefing in one shot.

## What Changes

- New MCP tool `summarise_unread` in `mcp-server/server.py` that:
  1. Calls `GET /chats` to find chats with `unread_count > 0`
  2. For each, calls `GET /chats/:id/unread?context=10` to get unread + prior context
  3. Builds a speaker map via the `speaker_map` helper
  4. Returns a labelled thread per chat formatted for Claude to summarise

## Capabilities

### New Capabilities

- `summarise-unread`: MCP tool that aggregates unread messages across all chats with speaker names resolved, ready for Claude to summarise in one tool call

### Modified Capabilities

## Impact

- `mcp-server/server.py`: new tool registered
- Depends on `mcp-speaker-map` and `wa-bridge-context-window` being implemented first
- No new dependencies
