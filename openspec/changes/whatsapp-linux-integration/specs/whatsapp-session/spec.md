## ADDED Requirements

### Requirement: QR code authentication
The system SHALL present a QR code in the terminal on first run so the user can link their WhatsApp account via the WhatsApp mobile app.

#### Scenario: First-time authentication
- **WHEN** the Node.js service starts with no existing session
- **THEN** a QR code is printed to stdout and the service waits for the user to scan it with their phone

#### Scenario: QR code expiry
- **WHEN** the QR code is not scanned within 60 seconds
- **THEN** a new QR code is generated and printed to stdout

### Requirement: Session persistence
The system SHALL persist session credentials to disk so that subsequent starts do not require re-authentication.

#### Scenario: Restart with valid session
- **WHEN** the Node.js service starts and a valid `.wwebjs_auth/` session directory exists
- **THEN** the service reconnects without presenting a QR code

#### Scenario: Session directory missing
- **WHEN** the `.wwebjs_auth/` directory does not exist or is corrupted
- **THEN** the service falls back to QR code authentication

### Requirement: Ready state signal
The system SHALL emit a log line containing `CLIENT_READY` when the WhatsApp client is fully authenticated and operational.

#### Scenario: Client becomes ready
- **WHEN** authentication completes (either via QR or persisted session)
- **THEN** the service logs `CLIENT_READY` to stdout and begins accepting HTTP requests

### Requirement: Graceful shutdown
The system SHALL shut down cleanly when sent SIGTERM or SIGINT.

#### Scenario: SIGTERM received
- **WHEN** the process receives SIGTERM
- **THEN** the Puppeteer browser is closed and the process exits with code 0
