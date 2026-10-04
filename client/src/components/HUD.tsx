import { useGameStore } from '../store/gameStore';

export function HUD() {
  const playerId = useGameStore((state) => state.playerId);
  const players = useGameStore((state) => state.players);
  const input = useGameStore((state) => state.input);
  const showControls = useGameStore((state) => state.showControls);
  
  const localPlayer = playerId ? players.get(playerId) : null;
  const aircraft = localPlayer?.aircraft;

  if (!aircraft) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Crosshair */}
      <div className="crosshair" />
      
      {/* Speed and Altitude - Left Panel */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 hud-panel p-4 rounded-lg w-48">
        <div className="space-y-4">
          <HUDGauge 
            label="SPEED" 
            value={Math.round(aircraft.speed * 3.6)} 
            unit="KM/H" 
            max={500}
            color="primary"
          />
          <HUDGauge 
            label="ALT" 
            value={Math.round(aircraft.altitude)} 
            unit="M" 
            max={5000}
            color="secondary"
          />
          <HUDGauge 
            label="THROTTLE" 
            value={Math.round(input.throttle * 100)} 
            unit="%" 
            max={100}
            color={input.boost ? 'warning' : 'primary'}
          />
        </div>
      </div>
      
      {/* Heading and Compass - Top */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 hud-panel px-6 py-3 rounded-lg">
        <div className="flex items-center gap-4">
          <CompassDisplay heading={aircraft.heading} />
        </div>
      </div>
      
      {/* Attitude Indicator - Right Panel */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 hud-panel p-4 rounded-lg">
        <AttitudeIndicator 
          pitch={input.pitch} 
          roll={input.roll}
          isOnGround={aircraft.isOnGround}
        />
      </div>
      
      {/* Player List - Top Right */}
      <PlayerList />
      
      {/* Controls Help - Bottom */}
      {showControls && <ControlsHelp />}
      
      {/* Status indicators */}
      <div className="absolute bottom-4 left-4 flex gap-2">
        {input.boost && (
          <div className="hud-panel px-3 py-1 rounded text-hud-warning text-sm font-bold animate-pulse">
            BOOST
          </div>
        )}
        {input.brake && (
          <div className="hud-panel px-3 py-1 rounded text-hud-danger text-sm font-bold">
            BRAKE
          </div>
        )}
        {aircraft.isOnGround && (
          <div className="hud-panel px-3 py-1 rounded text-hud-secondary text-sm">
            GROUNDED
          </div>
        )}
      </div>
    </div>
  );
}

interface HUDGaugeProps {
  label: string;
  value: number;
  unit: string;
  max: number;
  color: 'primary' | 'secondary' | 'warning' | 'danger';
}

function HUDGauge({ label, value, unit, max, color }: HUDGaugeProps) {
  const percentage = Math.min(100, (value / max) * 100);
  const colorClass = {
    primary: 'bg-hud-primary',
    secondary: 'bg-hud-secondary',
    warning: 'bg-hud-warning',
    danger: 'bg-hud-danger',
  }[color];

  return (
    <div>
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>{label}</span>
        <span>{unit}</span>
      </div>
      <div className="hud-value text-2xl hud-text">
        {value.toLocaleString()}
      </div>
      <div className="h-1 bg-gray-800 rounded-full mt-1 overflow-hidden">
        <div 
          className={`h-full ${colorClass} transition-all duration-100`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function CompassDisplay({ heading }: { heading: number }) {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(heading / 45) % 8;
  
  return (
    <div className="text-center">
      <div className="text-xs text-gray-400 mb-1">HEADING</div>
      <div className="flex items-center gap-3">
        <span className="hud-value text-2xl hud-text">
          {Math.round(heading).toString().padStart(3, '0')}°
        </span>
        <span className="text-lg text-hud-secondary font-bold">
          {directions[index]}
        </span>
      </div>
    </div>
  );
}

interface AttitudeIndicatorProps {
  pitch: number;
  roll: number;
  isOnGround: boolean;
}

function AttitudeIndicator({ pitch, roll }: AttitudeIndicatorProps) {
  return (
    <div className="w-32">
      <div className="text-xs text-gray-400 mb-2 text-center">ATTITUDE</div>
      <div className="relative w-32 h-32 rounded-full border-2 border-hud-primary/30 overflow-hidden bg-gradient-to-b from-blue-900 to-amber-900">
        {/* Horizon line */}
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ 
            transform: `rotate(${roll * 45}deg) translateY(${pitch * 30}px)` 
          }}
        >
          <div className="w-full h-0.5 bg-white" />
          <div className="absolute w-full h-1/2 bg-amber-800/50 top-1/2" />
        </div>
        
        {/* Aircraft symbol */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-0.5 bg-hud-primary" />
          <div className="absolute w-0.5 h-4 bg-hud-primary" />
        </div>
        
        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 w-2 h-2 -mt-1 -ml-1 rounded-full bg-hud-primary" />
      </div>
      
      <div className="mt-2 text-center text-xs">
        <span className={`${pitch < 0 ? 'text-hud-primary' : 'text-hud-warning'}`}>
          {pitch < 0 ? '↑ CLIMB' : pitch > 0 ? '↓ DIVE' : '— LEVEL'}
        </span>
      </div>
    </div>
  );
}

function PlayerList() {
  const players = useGameStore((state) => state.players);
  const playerId = useGameStore((state) => state.playerId);
  
  const playerArray = Array.from(players.values());
  
  return (
    <div className="absolute top-4 right-4 hud-panel p-3 rounded-lg min-w-40">
      <div className="text-xs text-gray-400 mb-2">PILOTS ({playerArray.length})</div>
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {playerArray.map((player) => (
          <div 
            key={player.id}
            className={`flex items-center gap-2 text-sm ${
              player.id === playerId ? 'text-hud-primary' : 'text-gray-300'
            }`}
          >
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: player.color }}
            />
            <span className="truncate">{player.name}</span>
            {player.id === playerId && <span className="text-xs">(you)</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function ControlsHelp() {
  const setShowControls = useGameStore((state) => state.setShowControls);
  
  return (
    <div className="absolute bottom-4 right-4 hud-panel p-3 rounded-lg text-xs pointer-events-auto">
      <div className="flex justify-between items-center mb-2">
        <span className="text-gray-400">CONTROLS</span>
        <button 
          onClick={() => setShowControls(false)}
          className="text-gray-500 hover:text-white"
        >
          ✕
        </button>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-gray-300">
        <span>W/S</span><span className="text-hud-primary">Pitch</span>
        <span>A/D</span><span className="text-hud-primary">Roll</span>
        <span>Q/E</span><span className="text-hud-primary">Yaw</span>
        <span>Shift</span><span className="text-hud-warning">Throttle Up</span>
        <span>Space</span><span className="text-hud-danger">Brake</span>
        <span>R</span><span className="text-hud-secondary">Respawn</span>
        <span>T</span><span className="text-gray-400">Chat</span>
      </div>
    </div>
  );
}
