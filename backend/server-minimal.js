// Minimal server - for debugging Railway 502. Responds immediately.
const http = require('http');
// Railway often uses 8080; try both. Set PORT=3000 in Railway Variables if 502.
const PORT = parseInt(process.env.PORT || '3000', 10);
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: true, msg: 'minimal server', port: PORT }));
});
server.listen(PORT, '0.0.0.0', () => {
  console.log('Minimal server listening on 0.0.0.0:' + PORT);
});
