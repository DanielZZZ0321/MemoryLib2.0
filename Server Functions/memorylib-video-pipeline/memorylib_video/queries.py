# queries.py

def filter_events(
    events: list[dict],
    keyword: str | None = None,
    activity_type: str | None = None,
    social_context: str | None = None,
    environment_contains: str | None = None,
) -> list[dict]:
    res = []
    for ev in events:
        if activity_type and ev.get("activity_type") != activity_type:
            continue
        if social_context and ev.get("social_context") != social_context:
            continue
        if environment_contains and environment_contains.lower() not in ev.get("environment", "").lower():
            continue
        if keyword:
            text = (ev.get("title", "") + " " + ev.get("summary", "")).lower()
            if keyword.lower() not in text:
                continue
        res.append(ev)
    return res

def events_in_range(events: list[dict], t_start: float, t_end: float) -> list[dict]:
    return [
        ev for ev in events
        if not (ev["end_sec"] < t_start or ev["start_sec"] > t_end)
    ]
