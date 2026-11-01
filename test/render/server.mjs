// Tiny static file server for the browser harnesses (serves the repository root).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.png': 'image/png', '.webp': 'image/webp', '.css': 'text/css', '.json': 'application/json', '.map': 'application/json', '.woff2': 'font/woff2' };

export function serve(port = 0) {
	return new Promise((resolve) => {
		const server = createServer(async (req, res) => {
			const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
			try {
				const body = await readFile(join(ROOT, path));
				res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' });
				res.end(body);
			} catch {
				res.writeHead(404);
				res.end('not found');
			}
		});
		server.listen(port, '127.0.0.1', () => resolve({ server, url: `http://127.0.0.1:${server.address().port}` }));
	});
}
