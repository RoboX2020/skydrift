# SkyDrift - Online Flight Simulator 🛩️

A multiplayer flight simulator built with React Three Fiber and Colyseus.

## Tech Stack

**Client:**
- React 18 + TypeScript
- React Three Fiber (Three.js)
- Zustand (state management)
- Tailwind CSS
- Vite

**Server:**
- Node.js + TypeScript
- Colyseus (multiplayer framework)
- Express

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone and navigate to project
cd skydrift

# Install all dependencies
npm install

# Build shared types
npm run build --workspace=@skydrift/shared
```

### Development

**Option 1: Run both server and client**
```bash
npm run dev
```

**Option 2: Run separately**
```bash
# Terminal 1 - Server
npm run dev:server

# Terminal 2 - Client
npm run dev:client
```

### Access
- **Game Client:** http://localhost:3000
- **Game Server:** ws://localhost:2567
- **Health Check:** http://localhost:2567/health

## Controls

| Key | Action |
|-----|--------|
| W / S | Pitch (nose up/down) |
| A / D | Roll (bank left/right) |
| Q / E | Yaw (turn left/right) |
| Shift | Increase throttle / Boost |
| Space | Brake / Decrease throttle |
| R | Respawn |
| T | Open chat |
| Esc | Close chat |

## Project Structure

```
skydrift/
├── client/                 # React Three Fiber game client
│   ├── src/
│   │   ├── components/     # React/3D components
│   │   ├── hooks/          # Custom hooks
│   │   ├── store/          # Zustand store
│   │   └── utils/          # Utilities
│   └── public/
├── server/                 # Colyseus game server
│   └── src/
│       ├── rooms/          # Game room logic
│       └── index.ts        # Server entry
└── shared/                 # Shared types & constants
    └── src/
```

## Features (MVP)

- [x] Real-time multiplayer (up to 16 players)
- [x] Basic flight physics (lift, drag, thrust, gravity)
- [x] Procedural terrain
- [x] Dynamic sky with day/night cycle
- [x] HUD with flight instruments
- [x] Player list and chat
- [x] Spawn/respawn system

## Roadmap

### Phase 2 - Enhanced Gameplay
- [ ] Checkpoints / racing mode
- [ ] Leaderboards
- [ ] More aircraft types
- [ ] Better terrain (heightmaps, textures)

### Phase 3 - Polish
- [ ] Sound effects & music
- [ ] Particle effects (exhaust, clouds)
- [ ] Mobile controls
- [ ] Replay system

### Phase 4 - Deployment
- [ ] Docker containerization
- [ ] Cloud deployment (Railway/Render + Vercel)
- [ ] Custom domain

## Deployment

### Server (Railway/Render)
```bash
cd server
npm run build
npm start
```

### Client (Vercel)
```bash
cd client
npm run build
# Deploy dist/ folder
```

## License

MIT

---

Built with ☁️ by Hamad
