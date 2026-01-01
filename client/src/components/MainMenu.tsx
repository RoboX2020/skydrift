import { useState } from 'react';
import { useGameStore } from '../store/gameStore';

export function MainMenu() {
  const [serverUrl, setServerUrl] = useState('ws://localhost:2567');
  const playerName = useGameStore((state) => state.playerName);
  const setPlayerName = useGameStore((state) => state.setPlayerName);
  const connect = useGameStore((state) => state.connect);
  const connecting = useGameStore((state) => state.connecting);
  const error = useGameStore((state) => state.error);

  const handleConnect = async () => {
    await connect(serverUrl, playerName);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-hud-primary/20"
              style={{
                width: Math.random() * 300 + 100,
                height: Math.random() * 300 + 100,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${10 + Math.random() * 20}s infinite`,
                animationDelay: `${Math.random() * 10}s`,
              }}
            />
          ))}
        </div>
      </div>
      
      <div className="relative z-10 text-center">
        {/* Logo */}
        <div className="mb-12">
          <h1 className="font-display text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-hud-primary via-hud-secondary to-hud-primary animate-pulse">
            SKYDRIFT
          </h1>
          <p className="text-gray-400 mt-2 tracking-widest text-sm">
            ONLINE FLIGHT SIMULATOR
          </p>
        </div>
        
        {/* Connection form */}
        <div className="hud-panel rounded-xl p-8 w-96">
          <div className="space-y-6">
            {/* Player name input */}
            <div>
              <label className="block text-left text-xs text-gray-400 mb-2 uppercase tracking-wider">
                Callsign
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your callsign"
                maxLength={20}
                className="w-full bg-slate-800/50 border border-hud-primary/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-hud-primary transition-colors"
              />
            </div>
            
            {/* Server URL input */}
            <div>
              <label className="block text-left text-xs text-gray-400 mb-2 uppercase tracking-wider">
                Server
              </label>
              <input
                type="text"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="ws://localhost:2567"
                className="w-full bg-slate-800/50 border border-hud-primary/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-hud-primary transition-colors font-mono text-sm"
              />
            </div>
            
            {/* Error message */}
            {error && (
              <div className="bg-red-900/30 border border-red-500/50 rounded-lg px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}
            
            {/* Connect button */}
            <button
              onClick={handleConnect}
              disabled={connecting || !playerName.trim()}
              className="w-full bg-gradient-to-r from-hud-primary to-hud-secondary text-slate-900 font-bold py-4 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
            >
              {connecting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="loading-spinner w-5 h-5 border-2 border-slate-900" />
                  Connecting...
                </span>
              ) : (
                'Take Off'
              )}
            </button>
          </div>
        </div>
        
        {/* Controls preview */}
        <div className="mt-8 text-gray-500 text-xs">
          <div className="flex justify-center gap-8">
            <span>W/S - Pitch</span>
            <span>A/D - Roll</span>
            <span>Q/E - Yaw</span>
            <span>Shift - Throttle</span>
          </div>
        </div>
        
        {/* Version */}
        <div className="mt-8 text-gray-600 text-xs">
          v0.1.0 MVP
        </div>
      </div>
      
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
      `}</style>
    </div>
  );
}
