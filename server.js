import { resolve, relative, extname, sep, isAbsolute } from "node:path";

const PORT = Number(process.env.PORT ?? 3000);
const BASE_URL =
  process.env.BASE_URL ??
  (process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : `http://localhost:${PORT}`);
const PUBLIC_DIR = process.env.PUBLIC_DIR ?? null;

/** @type {Map<string, {code:string,url:string,shortUrl:string,hits:number,createdAt:string}>} */
const links = new Map();

const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function randomCode(len = 6) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => BASE62[b % 62]).join("");
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain",
  ".webmanifest": "application/manifest+json",
};

async function serveStatic(pathname) {
  if (!PUBLIC_DIR) return null;
  const absDir = resolve(PUBLIC_DIR);
  const rel = pathname === "/" ? "index.html" : pathname.slice(1);
  const absFile = resolve(absDir, rel);
  // Prevent path traversal (catches "../" and cross-drive absolute paths on Windows)
  const rel2 = relative(absDir, absFile);
  if (rel2 === "" || rel2 === ".." || rel2.startsWith(".." + sep) || isAbsolute(rel2)) {
    return null;
  }
  try {
    const file = Bun.file(absFile);
    if (!(await file.exists())) return null;
    const ext = extname(absFile).toLowerCase();
    return new Response(file, {
      headers: { "Content-Type": MIME[ext] ?? "application/octet-stream", ...CORS_HEADERS },
    });
  } catch {
    return null;
  }
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const { pathname } = new URL(req.url);
    const method = req.method;

    // CORS preflight
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // POST /api/links — shorten a URL
    if (method === "POST" && pathname === "/api/links") {
      let body;
      try {
        body = await req.json();
      } catch {
        return json({ error: "Invalid JSON" }, 400);
      }
      const rawUrl = body?.url;
      if (typeof rawUrl !== "string" || !rawUrl) {
        return json({ error: "url is required" }, 400);
      }
      let parsed;
      try {
        parsed = new URL(rawUrl);
      } catch {
        return json({ error: "Invalid URL" }, 400);
      }
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return json({ error: "URL must use http or https" }, 400);
      }
      let code;
      do { code = randomCode(); } while (links.has(code));
      const link = {
        code,
        url: rawUrl,
        shortUrl: `${BASE_URL}/${code}`,
        hits: 0,
        createdAt: new Date().toISOString(),
      };
      links.set(code, link);
      return json(link, 201);
    }

    // GET /api/links — list all links
    if (method === "GET" && pathname === "/api/links") {
      return json([...links.values()]);
    }

    // GET * — static files win over short codes
    if (method === "GET") {
      const staticRes = await serveStatic(pathname);
      if (staticRes) return staticRes;

      if (pathname !== "/") {
        const code = pathname.slice(1);
        const link = links.get(code);
        if (link) {
          link.hits++;
          return new Response(null, {
            status: 302,
            headers: { Location: link.url, ...CORS_HEADERS },
          });
        }
      }
    }

    return new Response("Not Found", { status: 404, headers: CORS_HEADERS });
  },
});

console.log(`Snip backend listening on :${server.port}`);
console.log(`BASE_URL: ${BASE_URL}`);
