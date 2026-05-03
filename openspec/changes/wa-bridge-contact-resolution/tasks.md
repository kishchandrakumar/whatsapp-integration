## 1. Extend message objects with sender_name

- [x] 1.1 Add `resolveContactName(id, client)` async helper in `wa-bridge/index.js` that calls `waClient.getContactById(id)` and returns `name ?? pushname ?? id`
- [x] 1.2 Update message mapping in `GET /chats/:chat_id/messages` to include `sender_name`: call helper for each unique sender, return "You" for `is_from_me` messages
- [x] 1.3 Manual test: `curl /chats/:id/messages` and verify `sender_name` appears on each message object

## 2. Batch contact resolve endpoint

- [x] 2.1 Implement `GET /contacts/resolve?ids=a,b,c` route: parse comma-separated IDs, reject >50 with HTTP 400, resolve concurrently via `Promise.allSettled`, return `{id: name}` map
- [x] 2.2 Manual test: `curl "/contacts/resolve?ids=<lid1>,<lid2>"` and verify name map returned

## 3. Single contact lookup endpoint

- [x] 3.1 Implement `GET /contacts/:contact_id` route: call `getContactById`, return `{id, name, number}` or HTTP 404
- [x] 3.2 Manual test: `curl /contacts/<known_lid>` and verify name and number returned

## 4. Commit

- [ ] 4.1 Commit changes to `wa-bridge/index.js` with message `feat: add contact name resolution to bridge`
