import { useGameStore } from './store/gameStore';
import { MainMenu } from './components/MainMenu';
import { lazy, Suspense } from 'react';
const Game = lazy(() => import('./components/Game').then(m => ({ default: m.Game })));

function App() {
  const connected = useGameStore((state) => state.connected);
  
  return (
    <div className="w-full h-full bg-black">
      {connected ? <Suspense fallback={<div className="loading-screen">Opening the arena...</div>}><Game /></Suspense> : <MainMenu />}
    </div>
  );
}

export default App;
