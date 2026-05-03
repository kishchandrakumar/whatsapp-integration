## ADDED Requirements

### Requirement: List chats
The system SHALL return a list of recent chats with name, chat ID, last message preview, and unread count.

#### Scenario: Successful chat list
- **WHEN** `GET /chats` is called and the client is ready
- **THEN** the response is a JSON array of chat objects with fields: `id`, `name`, `last_message`, `unread_count`, `is_group`

#### Scenario: Client not ready
- **WHEN** `GET /chats` is called before the client has reached ready state
- **THEN** the response is HTTP 503 with `{"error": "client_not_ready"}`

### Requirement: Get messages from a chat
The system SHALL return recent messages from a specified chat.

#### Scenario: Successful message retrieval
- **WHEN** `GET /chats/{chat_id}/messages?limit=N` is called
- **THEN** the response is a JSON array of message objects with fields: `id`, `from`, `body`, `timestamp`, `is_from_me`

#### Scenario: Chat not found
- **WHEN** `GET /chats/{chat_id}/messages` is called with an unknown `chat_id`
- **THEN** the response is HTTP 404 with `{"error": "chat_not_found"}`

### Requirement: Send text message
The system SHALL send a plain text message to a specified chat ID.

#### Scenario: Successful send
- **WHEN** `POST /chats/{chat_id}/send` is called with `{"text": "..."}` and the client is ready
- **THEN** the message is delivered and the response is `{"status": "sent", "message_id": "..."}`

#### Scenario: Empty message body
- **WHEN** `POST /chats/{chat_id}/send` is called with an empty or missing `text` field
- **THEN** the response is HTTP 400 with `{"error": "empty_message"}`

#### Scenario: Send to unknown chat
- **WHEN** `POST /chats/{chat_id}/send` is called with an unknown `chat_id`
- **THEN** the response is HTTP 404 with `{"error": "chat_not_found"}`

### Requirement: Search chats by name
The system SHALL support filtering the chat list by a name query string.

#### Scenario: Matching chats found
- **WHEN** `GET /chats?search=Alice` is called
- **THEN** the response contains only chats whose name contains "Alice" (case-insensitive)

#### Scenario: No matches
- **WHEN** `GET /chats?search=zzznomatch` is called
- **THEN** the response is an empty JSON array
