# Snip

A tiny URL shortener built as a demo of the **git-submodule** architecture pattern.
Each layer of the stack lives on its own branch of this repo and is mounted here as a
submodule pinned to that branch.

## Layout

```
main  (superproject — this README + .gitmodules)
├── backend/   ← branch: backend   Bun 1.x server · zero npm deps · in-memory Map
├── frontend/  ← branch: frontend  Angular 19 · standalone components · signals
└── cli/       ← branch: cli       Node ≥18 · CommonJS · zero npm deps
```

## API contract

All three layers share one contract. The frontend and CLI both talk to the backend at
`:3000` (override with `SNIP_API` / `BASE_URL`).

| Method | Path | Body / Response |
|--------|------|-----------------|
| `POST` | `/api/links` | `{ "url": "https://…" }` → `201 { code, url, shortUrl, hits, createdAt }` · `400` |
| `GET`  | `/api/links` | `200` array of all links |
| `GET`  | `/:code` | `302` redirect (+1 hit) · `404` |

`shortUrl` uses `BASE_URL` (auto-detected from `RAILWAY_PUBLIC_DOMAIN`; defaults to
`http://localhost:3000`).

## Cloning

A plain `git clone` leaves the submodule folders empty. Always clone with:

```sh
git clone --recurse-submodules https://github.com/Low-LiPin/ai-sdlc-snip-demo.git snip
```

Already cloned without the flag? Run:

```sh
git submodule update --init --recursive
```

## Running all three layers

**Backend** — API on `:3000`:

```sh
cd backend
bun start          # production
bun run dev        # watch mode
```

**Frontend** — dev server on `:4200`:

```sh
cd frontend
npm install
npx ng serve       # build: npx ng build
```

**CLI** — talks to the backend at `http://localhost:3000` by default:

```sh
cd cli
node cli.js add https://example.com/very/long/url   # prints the short link
node cli.js ls                                       # table of all links
node cli.js open <code>                              # opens in OS browser

# Override backend URL:
SNIP_API=https://your-deployment.railway.app node cli.js ls
```

## Branch layout

| Branch | Contents | Stack |
|--------|----------|-------|
| `backend`  | `server.js`, `package.json` | Bun 1.x, zero npm deps |
| `frontend` | Angular 19 app (`src/`, `angular.json`, …) | Angular 19, signals, HttpClient |
| `cli`      | `cli.js`, `package.json`, shell wrappers | Node ≥18, CommonJS, zero npm deps |
| `main`     | This README, `.gitmodules` | Superproject |

## Update workflow

Each layer is developed independently on its own branch. To ship a change:

**1. Edit inside the submodule, commit and push there:**

```sh
cd backend
# ... edit server.js ...
git add server.js
git commit -m "fix: handle missing url field"
git push
```

**2. Bump the pointer in the superproject:**

```sh
cd ..                                      # back to the superproject root
git submodule update --remote backend      # fast-forward to the latest commit
git add backend
git commit -m "chore: bump backend pointer"
git push
```

Without step 2, the superproject still pins the old commit even though the branch
moved forward. The submodule pointer is what the Docker / CI release pipeline watches.
