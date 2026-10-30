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
  
  const gameServer = new Server({
    transport: new WebSocketTransport({
      server: httpServer,
    }),
  });
  
  // Register game room
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
