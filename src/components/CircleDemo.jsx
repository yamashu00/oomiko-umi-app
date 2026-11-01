import { useEffect, useRef, useState } from 'react';
import { TopBar } from './common.jsx';
import { fmt } from '../math.js';

// 円の上を回る点を横から見ると、波と同じ上下運動になる（11/4 一般角・弧度法の復習）
export default function CircleDemo({ onBack }) {
  const [theta, setTheta] = useState(0);
  const [playing, setPlaying] = useState(false);
  const last = useRef(0);
  const MAX = 4 * Math.PI;

  useEffect(() => {
    if (!playing) return;
    let id;
    const tick = (now) => {
      if (last.current) {
        const dt = (now - last.current) / 1000;
        setTheta((th) => (th + dt * 1.2 > MAX ? 0 : th + dt * 1.2));
      }
      last.current = now;
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(id); last.current = 0; };
  }, [playing]);

  const R = 56;
  const cx = 74;
  const cy = 100;
  const gx0 = 150;
  const gx1 = 318;
  const gx = (th) => gx0 + (th / MAX) * (gx1 - gx0);
  const px = cx + R * Math.cos(theta);
  const py = cy - R * Math.sin(theta);

  let curve = '';
  for (let i = 0; i <= 200; i++) {
    const th = (i / 200) * MAX;
    curve += `${i ? 'L' : 'M'}${gx(th).toFixed(1)},${(cy - R * Math.sin(th)).toFixed(1)}`;
  }
  let drawn = '';
  const n = Math.max(1, Math.round((theta / MAX) * 200));
  for (let i = 0; i <= n; i++) {
    const th = (i / n) * theta;
    drawn += `${i ? 'L' : 'M'}${gx(th).toFixed(1)},${(cy - R * Math.sin(th)).toFixed(1)}`;
  }
  const deg = (theta * 180) / Math.PI;
  const turns = Math.floor(theta / (2 * Math.PI));

  return (
    <>
      <TopBar title="回転と波" chip="a" chipLabel="波" onBack={onBack} />
      <div className="screen">
        <p className="lead">円の上を回る点を<b>真横から</b>見ると、上下に動いて見える。波の上下とくらべてみよう。</p>
        <svg viewBox="0 0 340 200" style={{ width: '100%', background: '#fff', border: '1px solid var(--line)', borderRadius: 12 }}>
          <circle cx={cx} cy={cy} r={R} fill="var(--sea-light)" stroke="#99c6e2" />
          <line x1={cx - R - 8} x2={gx1} y1={cy} y2={cy} stroke="#b9cdd8" />
          <line x1={cx} x2={cx} y1={cy - R - 8} y2={cy + R + 8} stroke="#b9cdd8" />
          <path d={curve} fill="none" stroke="#d3e2ea" strokeWidth="2" />
          <path d={drawn} fill="none" stroke="#466ca6" strokeWidth="3" />
          <line x1={cx} y1={cy} x2={px} y2={py} stroke="#0068b5" strokeWidth="2" />
          <line x1={px} y1={py} x2={gx(theta)} y2={py} stroke="#aa6255" strokeDasharray="4 3" />
          <circle cx={px} cy={py} r="6" fill="#0068b5" />
          <circle cx={gx(theta)} cy={py} r="6" fill="#aa6255" />
          {[1, 2, 3, 4].map((k) => (
            <text key={k} x={gx(k * Math.PI)} y={cy + R + 22} fontSize="11" fill="#6d7682" textAnchor="middle">{k === 1 ? 'π' : `${k}π`}</text>
          ))}
        </svg>

        <div className="result">
          <div className="value" style={{ fontSize: 28 }}>θ = {fmt(theta / Math.PI, 2)}π rad</div>
          <div className="range">＝ {fmt(deg, 0)}°{turns > 0 && `（${turns}周 ＋ ${fmt(deg - 360 * turns, 0)}°）`} ／ sinθ = {fmt(Math.sin(theta), 2)}</div>
        </div>

        <input type="range" min={0} max={MAX} step={0.01} value={theta} onChange={(e) => { setPlaying(false); setTheta(Number(e.target.value)); }} style={{ width: '100%' }} />
        <button className="btn" onClick={() => setPlaying(!playing)}>{playing ? '⏸ 止める' : '▶ 回す'}</button>

        <div className="card tint" style={{ marginTop: 12 }}>
          <h3>💭 考えてみよう</h3>
          <div className="note">・360°をこえて回るとグラフはどうなる？ ・波の周期が4秒なら、この点は1秒に何 rad 回ればいい？</div>
        </div>
      </div>
    </>
  );
}
