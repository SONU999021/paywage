import http from 'node:http';
import app from './app.js';
import { env } from './config/env.js';

const server = http.createServer(app);

server.listen(env.PORT, '0.0.0.0', () => {
  console.log(`PayWager API listening on 0.0.0.0:${env.PORT}`);
  console.log(`Health:  http://localhost:${env.PORT}/health`);
  console.log(`Swagger: http://localhost:${env.PORT}/api/docs`);
});

server.on('error', (err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});

function shutdown(signal: string) {
  console.log(`${signal} received — shutting down gracefully`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
