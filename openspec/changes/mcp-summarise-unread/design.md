## Context

After `wa-bridge-contact-resolution`, `wa-bridge-context-window`, and `mcp-speaker-map` are in place, the summarise_unread tool becomes a thin orchestration layer: fetch unread chats, get messages with context, build speaker map, return a formatted thread per chat. Claude then summarises the output using its own language understanding.

## Goals / Non-Goals

**Goals:**
- New `summarise_unread` MCP tool that returns a structured multi-chat thread digest (one block per unread chat, labelled with speaker names)
- Claude uses the returned text as input to produce a human-readable summary

**Non-Goals:**
- Claude-side summarisation logic lives in the prompt, not in this tool — the tool only fetches and formats
- No filtering by chat type (individual vs group) in v1 — all unread chats are included
- No deduplication of chats already summarised in a previous call

## Decisions

### D1: Tool returns formatted text, not raw JSON

The tool output is a string Claude reads directly. Returning structured JSON would require Claude to parse it before summarising — unnecessary friction. Formatted text like `[Chat: Family Group]\n[2026-05-03 10:01] Sneja: ...` is immediately usable in a summarisation prompt.

### D2: Context window of 10 messages prepended

Default context is 10 messages before the unread window. This is enough to understand what a reply is responding to without drowning the context window in history.

### D3: Orchestration entirely in Python, no new bridge endpoints

The tool chains existing bridge calls (`/chats`, `/chats/:id/unread?context=10`) and the speaker map helper. No new bridge surface needed.

## Risks / Trade-offs

- **Large unread counts**: a chat with 200 unread messages could generate very long tool output. → Mitigation: cap unread fetch at 50 per chat; note the cap in the output.
- **Depends on three prior changes**: all of `wa-bridge-contact-resolution`, `wa-bridge-context-window`, `mcp-speaker-map` must be complete. → Mitigation: document the dependency chain; implement in order.
- **No message streaming**: Claude gets the full thread at once. For very active group chats this may hit context limits. → Accepted for v1.
