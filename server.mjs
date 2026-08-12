import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const root = new URL('./public/', import.meta.url).pathname;
const port = 4173;
const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};
const metadataCache = new Map();

createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
  if (pathname === '/api/metadata') {
    const id = new URL(request.url, `http://${request.headers.host}`).searchParams.get('id');
    if (!/^[\w-]{11}$/.test(id || '')) {
      response.writeHead(400, {'Content-Type':'application/json'}).end('{"error":"Invalid video ID"}');
      return;
    }
    try {
      if (!metadataCache.has(id)) {
        const target = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}&format=json`;
        const upstream = await fetch(target);
        if (!upstream.ok) throw new Error('Metadata unavailable');
        const data = await upstream.json();
        metadataCache.set(id, {title:data.title, author:data.author_name});
      }
      response.writeHead(200, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=86400'}).end(JSON.stringify(metadataCache.get(id)));
    } catch {
      response.writeHead(502, {'Content-Type':'application/json'}).end('{"error":"Metadata unavailable"}');
    }
    return;
  }
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const file = normalize(join(root, relative));

  if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) {
    response.writeHead(404).end('Not found');
    return;
  }

  const extension = extname(file).toLowerCase();
  const headers = {
    'Content-Type': types[extension] || 'application/octet-stream',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Content-Type-Options': 'nosniff'
  };

  response.writeHead(200, headers);
  createReadStream(file).pipe(response);
}).listen(port, '127.0.0.1', () => {
  console.log(`Focus Clock: http://localhost:${port}`);
});
