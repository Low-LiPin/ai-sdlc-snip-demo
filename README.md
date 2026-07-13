# snip-backend

Tiny URL shortener — single Bun file, zero npm dependencies, in-memory storage.

## Quick start

```sh
bun start
```

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Listening port |
| `BASE_URL` | `http://localhost:<PORT>` | Origin used in `shortUrl`; auto-detected from `RAILWAY_PUBLIC_DOMAIN` when set |
| `PUBLIC_DIR` | — | Optional path; serves static files (existing file wins over a same-named short code) |

## API

| Method | Path | Request / Response |
|---|---|---|
| `POST` | `/api/links` | `{ "url": "https://…" }` → `201 { code, url, shortUrl, hits, createdAt }` · `400` on bad input |
| `GET` | `/api/links` | `200` array of all links |
| `GET` | `/:code` | `302` redirect (+1 hit) · `404` if unknown |
