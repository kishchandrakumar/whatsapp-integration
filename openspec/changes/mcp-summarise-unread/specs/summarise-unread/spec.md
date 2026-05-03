## ADDED Requirements

### Requirement: summarise_unread MCP tool
The MCP server SHALL expose a `summarise_unread` tool that returns a formatted multi-chat digest of all unread WhatsApp messages with resolved speaker names.

#### Scenario: Unread messages exist across multiple chats
- **WHEN** `summarise_unread` is called and multiple chats have `unread_count > 0`
- **THEN** the tool returns one labelled block per chat containing timestamped, speaker-named messages ready for Claude to summarise

#### Scenario: No unread messages
- **WHEN** `summarise_unread` is called and no chats have unread messages
- **THEN** the tool returns a plain text message: "No unread messages."

#### Scenario: Bridge unavailable
- **WHEN** the wa-bridge is not running
- **THEN** the tool returns the standard bridge-unavailable error message

### Requirement: Context window prepended to unread messages
`summarise_unread` SHALL include up to 10 prior-context messages before each chat's unread window, tagged so Claude can distinguish background from new messages.

#### Scenario: Context available
- **WHEN** a chat has prior messages before the unread window
- **THEN** up to 10 prior messages appear labelled `[context]` before the unread messages

#### Scenario: No prior context
- **WHEN** the unread messages are the first messages in the chat
- **THEN** no context block appears; only the unread messages are shown

### Requirement: Unread fetch capped at 50 messages per chat
`summarise_unread` SHALL fetch at most 50 unread messages per chat to prevent excessive context window usage.

#### Scenario: Chat has more than 50 unread messages
- **WHEN** `unread_count > 50`
- **THEN** only the 50 most recent unread messages are fetched; the output notes "50 of N unread messages shown"
