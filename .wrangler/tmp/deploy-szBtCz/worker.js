var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/worker.js
var metadataCache = /* @__PURE__ */ new Map();
function json(body, status = 200, cache = false) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff"
  };
  if (cache) headers["Cache-Control"] = "public, max-age=86400";
  return new Response(JSON.stringify(body), { status, headers });
}
__name(json, "json");
async function metadata(request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!/^[\w-]{11}$/.test(id || "")) return json({ error: "Invalid video ID" }, 400);
  try {
    if (!metadataCache.has(id)) {
      const watchUrl = `https://www.youtube.com/watch?v=${id}`;
      const target = `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`;
      const upstream = await fetch(target);
      if (!upstream.ok) throw new Error("Metadata unavailable");
      const data = await upstream.json();
      metadataCache.set(id, { title: data.title, author: data.author_name });
    }
    return json(metadataCache.get(id), 200, true);
  } catch {
    return json({ error: "Metadata unavailable" }, 502);
  }
}
__name(metadata, "metadata");
var worker_default = {
  fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/metadata") return metadata(request);
    if (url.pathname.startsWith("/api/")) return json({ error: "Not found" }, 404);
    return env.ASSETS.fetch(request);
  }
};
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map
