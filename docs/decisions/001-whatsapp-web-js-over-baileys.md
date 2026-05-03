## Context

We need programmatic WhatsApp access on Linux. Two realistic library options exist: `whatsapp-web.js` (Puppeteer-based WhatsApp Web automation) and Baileys (direct multi-device protocol implementation).

## Options Considered

**Option A: `whatsapp-web.js`**
- Automates WhatsApp Web via headless Chromium
- High-level API: events, message objects, send helpers
- Active community, frequent updates

**Option B: Baileys**
- Implements the WhatsApp multi-device binary protocol directly
- No browser dependency — lighter resource footprint
- Lower-level: requires handling protobuf definitions and encryption manually

## Decision

Use `whatsapp-web.js`.

## Tradeoffs Accepted

- Adds ~300MB Chromium/Puppeteer dependency
- Puppeteer keeps a full browser process running while the service is active
- Tradeoff accepted because: `whatsapp-web.js` abstracts the entire session handshake, message decoding, and QR flow. Baileys requires maintaining proto schemas that break whenever WhatsApp updates its binary protocol — significantly higher maintenance burden for a personal productivity tool.
