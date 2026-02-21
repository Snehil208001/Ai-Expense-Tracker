// Minimal server - for debugging Railway 502. Responds immediately.
const http = require('http');
const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: true, msg: 'minimal server', port: PORT }));
});
server.listen(PORT, '0.0.0.0', () => {
  console.log('Minimal server listening on 0.0.0.0:' + PORT);
});
