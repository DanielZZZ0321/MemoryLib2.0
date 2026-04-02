# Video ingest demo (CC walking POV)

## Demo source video

- **Source**: Rambling Man (Andrew Bowden)
- **License**: Creative Commons Attribution (CC BY 3.0) for new videos since 2011-09-25
- **License / attribution requirements**: `https://ramblingman.org.uk/about/cc/`
- **Example page**: `https://ramblingman.org.uk/video/looking-up-a-random-hill/`

> Note: Some older videos may not be CC-licensed; use a video that is explicitly marked CC in its YouTube description/video, per the author's note.

## Expected backend output shape

After `POST /api/video/upload` then `POST /api/video/ingest`:

- **Global events created**: one per timeline segment, stored in SQLite `events_global` with unique `evt_*` ids and `{video_id,start_ms,end_ms}` references.
- **Themes created**: up to 6 `theme_*` nodes in SQLite `themes`, linked to events via `theme_event`.
- **Card created**: one `card_*` record in SQLite `cards`, with graph in `card_graph`:
  - `nodes_json`: `[{ id, label, score }]`
  - `edges_json`: `[{ source, target, weight }]`
  - `layout_json`: `{ [themeId]: { x, y } }` (fixed 6-node template)

## Minimal API calls

1) Upload + timeline analysis (optional):
- `POST /api/video/upload?timeline=true` (multipart field `video`)

2) Ingest into global memory + create a card:
- `POST /api/video/ingest`

Body:

```json
{
  "video": { "filename": "video-xxx.mp4" },
  "card": { "title": "My vlog card", "topThemes": 6 }
}
```

3) Fetch the card:
- `GET /api/cards/:cardId`

4) Fetch events for a theme/card:
- `GET /api/events-global?cardId=:cardId&themeId=:themeId`

