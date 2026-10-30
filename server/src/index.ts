// ============================================================================
// index.ts - the server's front door.
//
// Starts one Node.js process that does two jobs on the same port (2567):
//   1. a tiny web (HTTP) API: /health for uptime checks, /rooms for info
//   2. the Colyseus game server: phones and the big screen connect here
//      over WebSockets and join "skydrift" rooms (see rooms/SkyDriftRoom.ts)
//
// RUN IT: npm install && npm run dev  (inside the server/ folder)
// WHEN DEBUGGING (reasoned from the code):
//   - "port already in use": another SkyDrift server is already running;
//     stop it or set PORT to a different number.
//   - phones can't connect from another network: the free hosting tier can
//     take ~a minute to wake up, and the client needs the wss:// URL.
// ============================================================================
import { Server } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { SkyDriftRoom } from './rooms/SkyDriftRoom';

const PORT = Number(process.env.PORT) || 2567;

async function main() {
  const app = express();
  
  app.use(cors());
  app.use(express.json());
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });
  
  // Room info endpoint
  app.get('/rooms', async (req, res) => {
    res.json({ 
      message: 'Use Colyseus client to connect',
      wsUrl: `ws://localhost:${PORT}`,
    });
  });
  
  const httpServer = createServer(app);
  
  // Attach the game server to the same port as the web API.
  const gameServer = new Server({
    transport: new WebSocketTransport({
      server: httpServer,
    }),
  });
  
  // Register game room
  // (clients asking for "skydrift" get a SkyDriftRoom)
  gameServer.define('skydrift', SkyDriftRoom);
  
  httpServer.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════╗
║           🛩️  SkyDrift Server  🛩️          ║
╠═══════════════════════════════════════════╣
║  WebSocket: ws://localhost:${PORT}           ║
║  HTTP:      http://localhost:${PORT}         ║
║  Health:    http://localhost:${PORT}/health  ║
╚═══════════════════════════════════════════╝
    `);
  });
}

main().catch(console.error);
