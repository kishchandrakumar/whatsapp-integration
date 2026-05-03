## Context

The bridge's `GET /chats/:id/messages?limit=N` returns the N most recent messages. For the `summarise_unread` flow, we need the unread messages plus K messages immediately before them for conversational context. Currently callers must over-fetch (large limit) and trim client-side, wasting bandwidth and making the MCP layer complex.

## Goals / Non-Goals

**Goals:**
- Add `?context=N` to the existing messages route: returns `limit` unread messages + N messages before them
- Add `GET /chats/:id/unread` dedicated endpoint returning unread messages with optional `?context=N` prepended

**Non-Goals:**
- Pagination beyond the context window
- Marking messages as read
- Filtering by timestamp or sender

## Decisions

### D1: New `/unread` route rather than flag on existing messages route

`GET /chats/:id/unread` has a clearly different semantic (driven by `chat.unreadCount`) vs the general messages route. Separating them keeps the existing route stable and makes the unread intent explicit to callers.

### D2: Context messages tagged with `is_context: true`

Messages prepended as context carry `is_context: true` in the response so the MCP layer (and Claude) can distinguish "background" from "unread". This avoids Claude treating context messages as new.

### D3: `chat.fetchMessages` with a calculated offset

`whatsapp-web.js` `fetchMessages({limit})` always returns the most recent N. To get context messages before the unread window we fetch `unreadCount + context` total and split: first `context` items are context, remainder are unread.

## Risks / Trade-offs

- **`unreadCount` accuracy**: `chat.unreadCount` may not perfectly match the actual number of unread messages after reconnect. → Mitigation: treat it as a best-effort window; over-fetching by 1-2 is harmless.
- **No cross-session unread tracking**: WhatsApp marks messages read when viewed on phone; the bridge has no independent read-state. → Accepted for v1.
