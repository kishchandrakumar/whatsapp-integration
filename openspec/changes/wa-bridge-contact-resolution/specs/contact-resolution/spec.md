## ADDED Requirements

### Requirement: sender_name on message objects
Every message object returned by `GET /chats/:chat_id/messages` SHALL include a `sender_name` field containing the resolved display name for the sender.

#### Scenario: Sender is in address book
- **WHEN** a message is fetched and the sender's contact exists in WhatsApp
- **THEN** `sender_name` is the contact's display name (preferring `name` over `pushname`)

#### Scenario: Sender not in address book
- **WHEN** a message is fetched and `getContactById` returns no display name
- **THEN** `sender_name` falls back to the raw `from` field value

#### Scenario: Own message
- **WHEN** `is_from_me` is true on a message
- **THEN** `sender_name` is `"You"`

### Requirement: Batch contact resolve endpoint
The bridge SHALL expose `GET /contacts/resolve` accepting an `ids` query parameter (comma-separated list of contact IDs) and returning a JSON object mapping each ID to its resolved display name.

#### Scenario: All IDs resolve
- **WHEN** `GET /contacts/resolve?ids=123@lid,456@lid` is called and both contacts exist
- **THEN** response is `{"123@lid": "Alice", "456@lid": "Bob"}`

#### Scenario: Partial resolution
- **WHEN** one ID resolves and another does not
- **THEN** the resolved ID appears in the map; the unresolved ID is omitted

#### Scenario: Batch capped at 50
- **WHEN** more than 50 IDs are provided
- **THEN** response is HTTP 400 with `{"error": "too_many_ids"}`

### Requirement: Single contact lookup endpoint
The bridge SHALL expose `GET /contacts/:contact_id` returning the display name and phone number for a single contact.

#### Scenario: Contact found
- **WHEN** `GET /contacts/447700900123@c.us` is called and the contact exists
- **THEN** response is `{"id": "...", "name": "Alice", "number": "447700900123"}`

#### Scenario: Contact not found
- **WHEN** the contact ID is unknown
- **THEN** response is HTTP 404 with `{"error": "contact_not_found"}`
