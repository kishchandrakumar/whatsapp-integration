## Context

The bridge currently returns raw `from` fields on messages (e.g. `168835315405013@lid`). `whatsapp-web.js` exposes `waClient.getContactById(id)` which returns a `Contact` object with `name` and `pushname` fields. The challenge is that contact lookups are async and per-ID — we need to batch them efficiently without blocking message responses.

## Goals / Non-Goals

**Goals:**
- Add `sender_name` to every message object returned by `GET /chats/:id/messages`
- Add `GET /contacts/resolve` batch endpoint accepting an array of IDs, returning `{id: name}` map
- Add `GET /contacts/:id` single contact lookup endpoint

**Non-Goals:**
- Caching contact names across requests (defer to a future change)
- Syncing the full contacts list proactively
- Phone number lookup for non-`@lid` identifiers

## Decisions

### D1: Resolve names inline on message fetch rather than via a separate call

Keeping resolution in the message route means consumers get usable data in one request. The alternative — returning raw IDs and requiring callers to resolve — doubles the round trips for every consumer.

Tradeoff: message fetches are slower when a chat has many unique senders. Acceptable for v1 given group chats typically have <50 unique participants.

### D2: Fallback to raw ID on resolution failure

`getContactById` can fail for contacts not in the phone's address book. The field falls back to the raw `@lid` string rather than throwing, so the response is always complete.

### D3: Batch resolve endpoint uses `Promise.allSettled`

`GET /contacts/resolve` accepts a JSON body `{ids: [...]}` and resolves all IDs concurrently via `Promise.allSettled`, returning whatever succeeded and omitting failures from the map.

## Risks / Trade-offs

- **Latency on large threads**: resolving 30 unique contacts adds parallel async calls per message fetch. → Mitigation: `Promise.allSettled` runs them concurrently; acceptable for interactive use.
- **`getContactById` rate limiting**: no known rate limit in `whatsapp-web.js` for contact lookups, but untested at high volume. → Mitigation: cap batch resolve at 50 IDs per request.
