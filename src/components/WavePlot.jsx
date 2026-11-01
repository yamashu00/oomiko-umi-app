import { model } from '../math.js';

// 時間と高さのグラフ（y は −1〜1）
export default function WavePlot({ samples, fit, duration, height = 180 }) {
  const W = 340;
  const H = height;
  const pad = 24;
  const tMax = Math.max(duration || 0, samples.length ? samples[samples.length - 1].t : 1, 1);
  const x = (t) => pad + (t / tMax) * (W - pad - 6);
  const y = (v) => H / 2 - v * (H / 2 - 10);

  const dataPath = samples.map((s, i) => `${i ? 'L' : 'M'}${x(s.t).toFixed(1)},${y(s.y).toFixed(1)}`).join('');
  let fitPath = '';
  if (fit) {
    const n = 200;
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * tMax;
      fitPath += `${i ? 'L' : 'M'}${x(t).toFixed(1)},${y(model(fit, t)).toFixed(1)}`;
    }
  }
  const ticks = [];
  const step = tMax > 30 ? 10 : 5;
  for (let t = 0; t <= tMax; t += step) ticks.push(t);

  return (
    <svg viewBox={`0 0 ${W} ${H + 16}`} style={{ width: '100%', background: '#fff', border: '1px solid var(--line)', borderRadius: 12 }}>
      <line x1={pad} x2={W - 6} y1={H / 2} y2={H / 2} stroke="#b9cdd8" strokeDasharray="4 4" />
      <line x1={pad} x2={pad} y1={6} y2={H - 6} stroke="#b9cdd8" />
      {ticks.map((t) => (
        <text key={t} x={x(t)} y={H + 12} fontSize="10" fill="#6d7682" textAnchor="middle">{t}s</text>
      ))}
      <text x={4} y={14} fontSize="10" fill="#6d7682">高</text>
      <text x={4} y={H - 4} fontSize="10" fill="#6d7682">低</text>
      {dataPath && <path d={dataPath} fill="none" stroke="#0068b5" strokeWidth="2" />}
      {fitPath && <path d={fitPath} fill="none" stroke="#aa6255" strokeWidth="2.5" strokeDasharray="6 4" />}
    </svg>
  );
}
