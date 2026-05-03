import httpx


async def build_speaker_map(messages: list[dict], bridge_url: str) -> dict[str, str]:
    if not messages:
        return {}

    result: dict[str, str] = {}
    other_ids: set[str] = set()

    for msg in messages:
        if msg.get("is_from_me"):
            sender = msg.get("from", "")
            if sender:
                result[sender] = "You"
        else:
            sender = msg.get("from", "")
            if sender:
                other_ids.add(sender)

    if other_ids:
        ids_param = ",".join(other_ids)
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{bridge_url}/contacts/resolve",
                    params={"ids": ids_param},
                    timeout=10.0,
                )
                resp.raise_for_status()
                resolved: dict[str, str] = resp.json()
        except Exception:
            resolved = {}

        for id_ in other_ids:
            result[id_] = resolved.get(id_, id_)

    return result
