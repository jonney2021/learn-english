import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(fileURLToPath(new URL('.', import.meta.url)));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg' };
export const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const target = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!target.startsWith(root + path.sep) || pathname.split('/').some(p => p.startsWith('.')) || !['.html','.css','.js','.svg','.mp3'].includes(path.extname(target))) { res.writeHead(404).end('Not found'); return; }
    const body = await readFile(target);
    res.writeHead(200, { 'Content-Type': types[path.extname(target)], 'X-Content-Type-Options': 'nosniff' }); res.end(body);
  } catch { res.writeHead(404).end('Not found'); }
});
if (process.argv[1] === fileURLToPath(import.meta.url)) server.listen(Number(process.env.PORT) || 3000, '0.0.0.0', () => console.log('Northstar running on port ' + (process.env.PORT || 3000)));
