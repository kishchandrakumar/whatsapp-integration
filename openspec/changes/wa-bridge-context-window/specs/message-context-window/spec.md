## ADDED Requirements

### Requirement: context query param on messages route
`GET /chats/:chat_id/messages` SHALL accept an optional `?context=N` integer parameter that prepends N messages before the `limit` window.

#### Scenario: context param provided
- **WHEN** `GET /chats/:id/messages?limit=10&context=5` is called
- **THEN** response contains up to 15 messages: 5 context messages (oldest, `is_context: true`) followed by 10 regular messages (`is_context: false`)

#### Scenario: context param omitted
- **WHEN** `GET /chats/:id/messages?limit=10` is called with no `context` param
- **THEN** behaviour is unchanged from current — no `is_context` field on messages

#### Scenario: context exceeds available history
- **WHEN** `?context=20` is requested but fewer than 20 messages exist before the window
- **THEN** all available prior messages are returned without error

### Requirement: Unread messages endpoint
The bridge SHALL expose `GET /chats/:chat_id/unread` returning only the unread messages for that chat, with optional context prepended.

#### Scenario: Chat has unread messages
- **WHEN** `GET /chats/:id/unread` is called and `unreadCount > 0`
- **THEN** response contains `unreadCount` messages tagged `is_context: false`, preceded by `context` messages tagged `is_context: true` if `?context=N` is provided

#### Scenario: No unread messages
- **WHEN** `GET /chats/:id/unread` is called and `unreadCount == 0`
- **THEN** response is an empty JSON array

#### Scenario: Client not ready
- **WHEN** the bridge client has not reached ready state
- **THEN** response is HTTP 503 with `{"error": "client_not_ready"}`
