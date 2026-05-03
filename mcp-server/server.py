"""WhatsApp MCP server — exposes list_chats, get_messages, send_message, summarise_unread."""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone

import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import TextContent, Tool

from speaker_map import build_speaker_map

BRIDGE_URL = "http://localhost:3456"

app = Server("whatsapp")


def _bridge_unavailable() -> str:
    return (
        "WhatsApp bridge is not running. "
        "Start it with: cd wa-bridge && npm start"
    )


def _fmt_ts(ts: int) -> str:
    return datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%d %H:%M UTC")


@app.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="list_chats",
            description="List recent WhatsApp chats. Optionally filter by name.",
            inputSchema={
                "type": "object",
                "properties": {
                    "search": {
                        "type": "string",
                        "description": "Filter chats by name (case-insensitive)",
                    }
                },
            },
        ),
        Tool(
            name="get_messages",
            description="Get recent messages from a WhatsApp chat.",
            inputSchema={
                "type": "object",
                "properties": {
                    "chat_id": {"type": "string", "description": "Chat ID from list_chats"},
                    "limit": {
                        "type": "integer",
                        "description": "Number of messages to fetch (default 20, max 100)",
                        "default": 20,
                    },
                },
                "required": ["chat_id"],
            },
        ),
        Tool(
            name="send_message",
            description="Send a text message to a WhatsApp chat.",
            inputSchema={
                "type": "object",
                "properties": {
                    "chat_id": {"type": "string", "description": "Chat ID from list_chats"},
                    "text": {"type": "string", "description": "Message text to send"},
                },
                "required": ["chat_id", "text"],
            },
        ),
        Tool(
            name="summarise_unread",
            description=(
                "Fetch all unread WhatsApp messages across every chat with unread messages. "
                "Returns a labelled thread per chat with resolved speaker names and up to 10 "
                "prior-context messages, ready for Claude to summarise."
            ),
            inputSchema={"type": "object", "properties": {}},
        ),
    ]


@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    async with httpx.AsyncClient(timeout=30) as client:
        try:
            if name == "list_chats":
                params = {}
                if search := arguments.get("search"):
                    params["search"] = search
                resp = await client.get(f"{BRIDGE_URL}/chats", params=params)
                resp.raise_for_status()
                chats = resp.json()
                if not chats:
                    return [TextContent(type="text", text="No chats found.")]
                lines = []
                for c in chats:
                    unread = f" [{c['unread_count']} unread]" if c["unread_count"] else ""
                    group = " (group)" if c["is_group"] else ""
                    preview = f" — {c['last_message'][:60]}" if c["last_message"] else ""
                    lines.append(f"• {c['name']}{group}{unread}{preview}\n  id: {c['id']}")
                return [TextContent(type="text", text="\n".join(lines))]

            elif name == "get_messages":
                chat_id = arguments["chat_id"]
                limit = arguments.get("limit", 20)
                resp = await client.get(
                    f"{BRIDGE_URL}/chats/{chat_id}/messages", params={"limit": limit}
                )
                if resp.status_code == 404:
                    return [TextContent(type="text", text="Chat not found. Use list_chats to get valid IDs.")]
                resp.raise_for_status()
                messages = resp.json()
                if not messages:
                    return [TextContent(type="text", text="No messages found.")]
                lines = []
                for m in messages:
                    sender = "You" if m["is_from_me"] else m["from"].split("@")[0]
                    ts = _fmt_ts(m["timestamp"])
                    lines.append(f"[{ts}] {sender}: {m['body']}")
                return [TextContent(type="text", text="\n".join(lines))]

            elif name == "send_message":
                chat_id = arguments["chat_id"]
                text = arguments.get("text", "").strip()
                if not text:
                    return [TextContent(type="text", text="Error: text cannot be empty.")]
                resp = await client.post(
                    f"{BRIDGE_URL}/chats/{chat_id}/send", json={"text": text}
                )
                if resp.status_code == 404:
                    return [TextContent(type="text", text="Chat not found. Use list_chats to get valid IDs.")]
                if resp.status_code == 400:
                    return [TextContent(type="text", text="Error: message text was empty.")]
                resp.raise_for_status()
                data = resp.json()
                return [TextContent(type="text", text=f"Message sent. ID: {data['message_id']}")]

            elif name == "summarise_unread":
                resp = await client.get(f"{BRIDGE_URL}/chats")
                resp.raise_for_status()
                chats = resp.json()
                unread_chats = [c for c in chats if c.get("unread_count", 0) > 0]
                if not unread_chats:
                    return [TextContent(type="text", text="No unread messages.")]

                blocks: list[str] = []
                for chat in unread_chats:
                    chat_id = chat["id"]
                    chat_name = chat["name"]
                    unread_count = chat["unread_count"]

                    resp = await client.get(
                        f"{BRIDGE_URL}/chats/{chat_id}/unread",
                        params={"context": 10, "limit": 50},
                    )
                    resp.raise_for_status()
                    data = resp.json()

                    context_msgs: list[dict] = data.get("context", [])
                    unread_msgs: list[dict] = data.get("messages", [])
                    all_msgs = context_msgs + unread_msgs
                    speaker_map = await build_speaker_map(all_msgs, BRIDGE_URL)

                    cap_note = ""
                    if unread_count > 50:
                        cap_note = f" (50 of {unread_count} unread messages shown)"

                    header = f"[Chat: {chat_name}]{cap_note}"
                    lines = [header]

                    for m in context_msgs:
                        ts = _fmt_ts(m["timestamp"])
                        sender = speaker_map.get(m.get("from", ""), m.get("from", ""))
                        lines.append(f"[{ts}] [context] {sender}: {m['body']}")

                    for m in unread_msgs:
                        ts = _fmt_ts(m["timestamp"])
                        sender = speaker_map.get(m.get("from", ""), m.get("from", ""))
                        lines.append(f"[{ts}] {sender}: {m['body']}")

                    blocks.append("\n".join(lines))

                return [TextContent(type="text", text="\n\n".join(blocks))]

            else:
                return [TextContent(type="text", text=f"Unknown tool: {name}")]

        except httpx.ConnectError:
            return [TextContent(type="text", text=_bridge_unavailable())]
        except httpx.HTTPStatusError as e:
            body = e.response.text[:200]
            if "client_not_ready" in body:
                return [TextContent(type="text", text="WhatsApp client is not ready yet. Wait for CLIENT_READY log then retry.")]
            return [TextContent(type="text", text=f"Bridge error {e.response.status_code}: {body}")]


async def main() -> None:
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())


if __name__ == "__main__":
    asyncio.run(main())
