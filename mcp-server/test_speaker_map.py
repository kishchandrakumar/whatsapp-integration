"""
Manual test: load sample messages and resolve speaker map against the running bridge.

Usage:
    python test_speaker_map.py [bridge_url]

Default bridge_url: http://localhost:3000
"""
import asyncio
import json
import sys

import httpx
from speaker_map import build_speaker_map

SAMPLE_MESSAGES = [
    {"from": "447506416969@c.us", "is_from_me": False, "body": "Oooo"},
    {"from": "447506416969@c.us", "is_from_me": False, "body": "Got a bench in the middle area"},
    {"from": "218888830767220@lid", "is_from_me": True, "body": "test from Claude"},
    {"from": "218888830767220@lid", "is_from_me": True, "body": "WAG1 MA GGGGG"},
    {"from": "168835315405013@lid", "is_from_me": False, "body": "Claude stop"},
]


async def main() -> None:
    bridge_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000"
    print(f"Bridge: {bridge_url}")

    # Connectivity check
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{bridge_url}/status", timeout=3.0)
            print(f"Bridge status: {resp.status_code} {resp.text[:200]}")
    except Exception as e:
        print(f"Bridge connectivity check FAILED: {e}")
        print("Cannot resolve names — bridge is not reachable.")
        return

    print(f"\nInput messages:\n{json.dumps(SAMPLE_MESSAGES, indent=2)}\n")
    speaker_map = await build_speaker_map(SAMPLE_MESSAGES, bridge_url)
    print("Speaker map:")
    for id_, name in speaker_map.items():
        print(f"  {id_} -> {name}")


if __name__ == "__main__":
    asyncio.run(main())
