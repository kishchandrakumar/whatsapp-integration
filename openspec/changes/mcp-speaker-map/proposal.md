## Why

Group chat messages arrive with raw `@lid` sender IDs. Before Claude can summarise a thread meaningfully, it needs a `{lid: display_name}` map so messages read as "Sneja: ..." rather than "168835315405013@lid: ...". This helper centralises that resolution logic so `summarise_unread` and any future tools share one implementation.

## What Changes

- Add `build_speaker_map(messages, bridge_url)` async helper in `mcp-server/` that extracts unique sender IDs from a message list and batch-resolves them via the bridge's contact resolution endpoint
- Returns `dict[str, str]` mapping lid → display name, falling back to the raw ID if resolution fails

## Capabilities

### New Capabilities

- `speaker-map`: Async helper that resolves a list of message sender IDs to display names via the wa-bridge contact endpoint

### Modified Capabilities

## Impact

- New file `mcp-server/speaker_map.py`
- Depends on `wa-bridge-contact-resolution` being implemented first (needs the `/contacts/resolve` endpoint)
- No new Python dependencies beyond `httpx` (already in requirements.txt)
