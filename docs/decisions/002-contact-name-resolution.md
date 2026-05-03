## Context

WhatsApp messages carry raw sender IDs (e.g. `447911123456@c.us` or `168835315405013@lid`) rather than human-readable names. When Claude summarises messages, it needs real names to produce useful output — otherwise every line reads as an opaque ID. Additionally, unread messages often contain pronouns ("you", "he", "they") that refer to people who spoke earlier, outside the unread window.

## Options Considered

**Option A: Resolve names inside the MCP server using message metadata**

Messages returned by the bridge include a `sender_name` field populated by `whatsapp-web.js` from the contact's push name. The MCP server could use this directly without any extra bridge call.

- No extra HTTP round trip
- Push name is set by the contact themselves — can be anything, changes without notice
- Does not reflect your saved contact name (e.g. you saved "Amar" but their push name is "AmarHype Rai 👳")

**Option B: Resolve names via a dedicated `/contacts/resolve` bridge endpoint**

The bridge exposes `GET /contacts/resolve?ids=id1,id2,...` which calls `waClient.getContactById()` for each ID. This returns your saved contact name first, falling back to push name, then raw ID.

The MCP server collects all unique sender IDs from both context and unread messages, resolves them in one batched call, and builds a speaker map before formatting any output.

**Option C: Include context messages but skip name resolution**

Return raw IDs or push names and let Claude infer who is who from conversational cues.

- Fragile for group chats with many participants
- Breaks entirely when IDs change or contacts aren't saved

## Decision

Use **Option B** — dedicated `/contacts/resolve` endpoint with batched resolution in the MCP server, always including context messages in the resolution pass.

The speaker map (`mcp-server/speaker_map.py`) builds a `{sender_id → display_name}` dict covering all messages (context + unread) before any line is formatted. Messages from the authenticated user are mapped to `"You"` directly, bypassing the contact lookup.

Context messages (up to 10 prior messages per chat) are fetched via `/chats/:id/unread?context=10` and included in the resolution pass even though they are not part of the summary itself. This is necessary because unread messages frequently open mid-conversation ("yeah exactly", "did you confirm that?") and the pronoun referents only appear in the context window.

## Tradeoffs Accepted

- One extra HTTP call to `/contacts/resolve` per summarise operation (acceptable — batched, single round trip per chat)
- Resolution quality depends on your phone's contact list being up to date — unknown numbers fall back to push name or raw ID
- Context window of 10 messages is a fixed heuristic; very fast-moving chats may need more to resolve pronouns, but 10 covers the common case without bloating output
