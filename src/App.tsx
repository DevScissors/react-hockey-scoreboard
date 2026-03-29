import './App.css';
import { Scoreboard } from './components/Scoreboard/Scoreboard';

function App() {
  return (
    <div className='scoreboard-page-wrapper'>
      <header className='scoreboard-header'>React Scoreboard</header>
      <Scoreboard />
    </div>
  );
}

export default App;
