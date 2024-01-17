import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import serveHandler from 'serve-handler';

const server = createServer((req, res) => {
  return serveHandler(req, res, {
    public: './public',
  });
})

server.listen({ port: +(process.argv[2] ?? 8080), hostname: '0.0.0.0' }, () => {
  const addr = server.address();
  if (!addr || typeof addr === 'string') {
    console.log(`Listening on ${addr}`);
  } else {
    console.log(`Listening on http://0.0.0.0:${addr.port}`)
  }
});

const wss = new WebSocketServer({ server });

const clients: WebSocket[] = [];

wss.on('connection', function connection(ws) {
  ws.on('error', console.error);

  clients.push(ws);

  ws.on('message', function message(data, isBinary) {
    if (!Buffer.isBuffer(data)) return;
    clients.filter(v => v !== ws).forEach(v => v.send(new TextDecoder().decode(data)));
  });
});

