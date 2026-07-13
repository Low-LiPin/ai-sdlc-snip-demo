# snip-cli

Zero-dependency Node ≥18 CLI for the [Snip](https://github.com/Low-LiPin/ai-sdlc-snip-demo) URL shortener.

## Quick start

```sh
node cli.js add https://example.com/very/long/url
node cli.js ls
node cli.js open <code>
```

Or, after `npm install -g .`:

```sh
snip add https://example.com/very/long/url
snip ls
snip open <code>
```

## Commands

| Command | Description |
|---|---|
| `snip add <url>` | Shorten a URL; prints the short link |
| `snip ls` | List all links with code, hit count, and original URL |
| `snip open <code>` | Open the destination URL in the OS default browser |

## Config

| Variable | Default | Description |
|---|---|---|
| `SNIP_API` | `http://localhost:3000` | Backend base URL |

## Wrappers

| File | Platform |
|---|---|
| `snip` | POSIX shell (bash / zsh / sh) |
| `snip.cmd` | Windows CMD |
| `snip.ps1` | PowerShell (any platform) |
