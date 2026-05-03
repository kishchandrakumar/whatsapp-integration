## Context

Messages returned by the bridge include `from` (raw `@lid`) and `sender_name` (resolved, after `wa-bridge-contact-resolution` lands). The speaker map helper centralises the logic of scanning a message list and building a `{lid: name}` dict, so `summarise_unread` and any future tool share one implementation rather than duplicating contact resolution logic.

## Goals / Non-Goals

**Goals:**
- `build_speaker_map(messages, bridge_url) -> dict[str, str]`: extracts unique sender IDs, calls the bridge `/contacts/resolve` batch endpoint, returns `{id: display_name}`
- Falls back gracefully: if a contact can't be resolved, the raw ID is used as the name

**Non-Goals:**
- Caching across tool calls
- Resolving names for the authenticated user's own messages (`is_from_me: true`) — "You" is sufficient

## Decisions

### D1: Single batch call to `/contacts/resolve` rather than per-ID calls

One HTTP request for all unique senders in a thread is far more efficient than N serial calls. The bridge endpoint (added in `wa-bridge-contact-resolution`) accepts a list and returns a map.

### D2: Own messages always labelled "You"

Messages where `is_from_me` is true are labelled "You" directly in the helper without a contact lookup. This avoids a superfluous API call and is unambiguous.

### D3: Module lives at `mcp-server/speaker_map.py`

A standalone module (not embedded in `server.py`) keeps `server.py` focused on tool definitions and makes the helper independently testable.

## Risks / Trade-offs

- **Depends on `wa-bridge-contact-resolution`**: if that change isn't deployed, `/contacts/resolve` won't exist and the helper falls back to raw IDs throughout. → Mitigation: implement `wa-bridge-contact-resolution` first; document the dependency.
