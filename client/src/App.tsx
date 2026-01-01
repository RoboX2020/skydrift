import { useGameStore } from './store/gameStore';
import { MainMenu } from './components/MainMenu';
import { Game } from './components/Game';

function App() {
  const connected = useGameStore((state) => state.connected);
  
  return (
    <div className="w-full h-full bg-black">
      {connected ? <Game /> : <MainMenu />}
    </div>
  );
}

export default App;
