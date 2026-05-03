## 1. Implement speaker_map module

- [ ] 1.1 Create `mcp-server/speaker_map.py` with `async def build_speaker_map(messages: list[dict], bridge_url: str) -> dict[str, str]`
- [ ] 1.2 Collect unique `from` values where `is_from_me` is false; map own-message sender to "You"
- [ ] 1.3 Call `GET {bridge_url}/contacts/resolve?ids=<comma-joined>` via `httpx.AsyncClient`
- [ ] 1.4 Merge resolved names into output dict; fall back to raw ID for any unresolved entries
- [ ] 1.5 Return empty dict immediately when message list is empty

## 2. Test

- [ ] 2.1 Write a quick manual test script (`mcp-server/test_speaker_map.py`) that loads sample message JSON and calls `build_speaker_map` against the running bridge, prints the result
- [ ] 2.2 Run manual test and confirm names resolve correctly

## 3. Commit

- [ ] 3.1 Commit `mcp-server/speaker_map.py` with message `feat: add speaker map helper for contact name resolution`
