const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.env.PORT || 3001);
const root = path.join(__dirname, 'dist');
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.svg':'image/svg+xml', '.ico':'image/x-icon' };
const configuredApi = process.env.API_ORIGIN || process.env.VITE_API_URL || 'https://boss-edi-connector-production.up.railway.app';
let apiOrigin = 'https://boss-edi-connector-production.up.railway.app';
try { apiOrigin = new URL(configuredApi).origin; } catch { /* retain safe default */ }

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  if (urlPath === '/health') {
    res.writeHead(200, { 'content-type':'application/json', 'cache-control':'no-store' });
    return res.end(JSON.stringify({ status:'online', service:'Ray Land EDI Operations', version:'2.1.0' }));
  }
  const requested = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
  let file = path.resolve(root, requested);
  if (!file.startsWith(root)) { res.writeHead(400); return res.end('Bad request'); }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html');
  const extension = path.extname(file);
  res.writeHead(200, {
    'content-type': types[extension] || 'application/octet-stream',
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'referrer-policy': 'no-referrer',
    'content-security-policy': `default-src 'self'; connect-src 'self' ${apiOrigin}; img-src 'self' data:; style-src 'self'; script-src 'self'; frame-ancestors 'none'`,
    'cache-control': extension === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
  });
  fs.createReadStream(file).pipe(res);
});
server.listen(port, '0.0.0.0', () => console.log(`Ray Land EDI frontend listening on ${port}`));
