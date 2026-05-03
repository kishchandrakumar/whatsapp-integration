## ADDED Requirements

### Requirement: MCP tool — list_chats
The MCP server SHALL expose a `list_chats` tool that returns recent WhatsApp chats.

#### Scenario: Tool called successfully
- **WHEN** Claude invokes `list_chats` with optional `search` parameter
- **THEN** the tool returns a formatted list of chats with name, unread count, and last message

#### Scenario: WhatsApp service unavailable
- **WHEN** the Node.js bridge is not running when `list_chats` is called
- **THEN** the tool returns an error message instructing the user to start the WhatsApp service

### Requirement: MCP tool — get_messages
The MCP server SHALL expose a `get_messages` tool that retrieves messages from a chat.

#### Scenario: Tool called with chat_id
- **WHEN** Claude invokes `get_messages` with a `chat_id` and optional `limit`
- **THEN** the tool returns a formatted list of messages with sender, text, and timestamp

#### Scenario: Invalid chat_id
- **WHEN** Claude invokes `get_messages` with an unrecognised `chat_id`
- **THEN** the tool returns a user-readable error indicating the chat was not found

### Requirement: MCP tool — send_message
The MCP server SHALL expose a `send_message` tool that sends a text message to a chat.

#### Scenario: Message sent successfully
- **WHEN** Claude invokes `send_message` with `chat_id` and `text`
- **THEN** the tool confirms delivery with the message ID

#### Scenario: Confirmation gate
- **WHEN** `send_message` is invoked
- **THEN** the tool requires the `text` parameter to be non-empty and `chat_id` to be present; if either is missing it returns a descriptive error without sending

### Requirement: MCP server registration
The MCP server SHALL be registered in the project `.claude/settings.json` so Claude Code loads it automatically.

#### Scenario: Server registered in settings
- **WHEN** the project `.claude/settings.json` is present
- **THEN** it contains an entry under `mcpServers` pointing to the Python MCP server entrypoint with the correct command and args

#### Scenario: Server not running
- **WHEN** Claude Code starts and the MCP server process is not running
- **THEN** Claude Code surfaces a tool-unavailable error for WhatsApp tools; no crash occurs
