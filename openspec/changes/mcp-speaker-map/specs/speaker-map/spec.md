## ADDED Requirements

### Requirement: build_speaker_map resolves sender IDs to names
`build_speaker_map(messages, bridge_url)` SHALL accept a list of message dicts and a bridge base URL, and return a `dict[str, str]` mapping each unique sender ID to a display name.

#### Scenario: All senders resolved
- **WHEN** all unique `from` values in `messages` are resolved by the bridge
- **THEN** the returned dict contains an entry for each unique sender ID with the display name

#### Scenario: Own messages excluded from lookup
- **WHEN** a message has `is_from_me: true`
- **THEN** no contact lookup is made for that message; "You" is returned as the name for that sender

#### Scenario: Resolution failure for one sender
- **WHEN** the bridge fails to resolve a particular sender ID
- **THEN** the raw sender ID is used as the name in the returned dict; no exception is raised

#### Scenario: Empty message list
- **WHEN** `messages` is an empty list
- **THEN** an empty dict is returned

### Requirement: build_speaker_map uses batch resolve
`build_speaker_map` SHALL call the bridge `/contacts/resolve` endpoint once with all unique non-self sender IDs rather than making one call per sender.

#### Scenario: Multiple senders batched
- **WHEN** messages contain 5 unique senders
- **THEN** exactly one HTTP request is made to `/contacts/resolve`
