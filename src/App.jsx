import { useEffect, useState } from 'react';
import { loadState, saveState, makeId } from './storage.js';
import Home from './components/Home.jsx';
import Profile from './components/Profile.jsx';
import Records from './components/Records.jsx';
import WaveTimer from './components/WaveTimer.jsx';
import WaveTracker from './components/WaveTracker.jsx';
import CircleDemo from './components/CircleDemo.jsx';
import HeightTan from './components/HeightTan.jsx';
import TwoAngleHeight from './components/TwoAngleHeight.jsx';
import Triangulate from './components/Triangulate.jsx';
import WaveArt from './components/WaveArt.jsx';

export default function App() {
  const [state, setState] = useState(loadState);
  const [screen, setScreen] = useState('home');
  const [artSeed, setArtSeed] = useState(null);

  useEffect(() => saveState(state), [state]);
  useEffect(() => window.scrollTo(0, 0), [screen]);

  const addRecord = (rec) => {
    const id = makeId();
    setState((s) => ({ ...s, records: [{ id, team: s.team, createdAt: new Date().toISOString(), ...rec }, ...s.records] }));
    // 位置は取れたら後から付ける（電波・許可がなくても保存はできる）
    navigator.geolocation?.getCurrentPosition(
      (pos) => setState((s) => ({
        ...s,
        records: s.records.map((r) => (r.id === id ? { ...r, lat: +pos.coords.latitude.toFixed(6), lng: +pos.coords.longitude.toFixed(6) } : r)),
      })),
      () => {},
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  if (!state.team || screen === 'profile') {
    return (
      <div className="app">
        <Profile initial={state} onDone={(p) => { setState((s) => ({ ...s, ...p })); setScreen('home'); }} />
      </div>
    );
  }

  const back = () => setScreen('home');
  const common = { profile: state, onBack: back, onSave: addRecord };
  const screens = {
    home: <Home team={state.team} onOpen={(k) => { if (k === 'art') setArtSeed(null); setScreen(k); }} onEditProfile={() => setScreen('profile')} />,
    timer: <WaveTimer {...common} />,
    tracker: <WaveTracker {...common} onSendToArt={(seed) => { setArtSeed(seed); setScreen('art'); }} />,
    circle: <CircleDemo onBack={back} />,
    height: <HeightTan {...common} />,
    two: <TwoAngleHeight {...common} />,
    tri: <Triangulate {...common} />,
    art: <WaveArt key={artSeed ? 'seeded' : 'plain'} team={state.team} seed={artSeed} {...common} />,
    records: (
      <Records
        state={state}
        onDelete={(id) => setState((s) => ({ ...s, records: s.records.filter((r) => r.id !== id) }))}
        onReflection={(reflection) => setState((s) => ({ ...s, reflection }))}
      />
    ),
  };

  return (
    <div className="app">
      {screens[screen]}
      <nav className="bottomnav">
        {[
          { key: 'home', icon: '🏠', label: 'ホーム' },
          { key: 'art', icon: '🎨', label: 'アート' },
          { key: 'records', icon: '📋', label: `記録${state.records.length ? `（${state.records.length}）` : ''}` },
        ].map((n) => (
          <button key={n.key} className={screen === n.key ? 'active' : ''} onClick={() => { if (n.key === 'art') setArtSeed(null); setScreen(n.key); }}>
            <span className="icon">{n.icon}</span>
            {n.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
