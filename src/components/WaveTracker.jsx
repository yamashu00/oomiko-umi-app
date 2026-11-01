import { useEffect, useRef, useState } from 'react';
import { TopBar, SaveBox } from './common.jsx';
import WavePlot from './WavePlot.jsx';
import { autoFit, fmt, rms } from '../math.js';

const RATE_MS = 100;

// 浮いているものの上下を指でなぞって記録 → グラフ → sin を重ねる
export default function WaveTracker({ onBack, onSave, onSendToArt }) {
  const [duration, setDuration] = useState(20);
  const [recording, setRecording] = useState(false);
  const [samples, setSamples] = useState([]);
  const [markerY, setMarkerY] = useState(0);
  const [showFit, setShowFit] = useState(false);
  const [p, setP] = useState({ A: 0.5, T: 5, phi: 0, C: 0 });
  const padRef = useRef(null);
  const yRef = useRef(0);
  const startRef = useRef(0);

  useEffect(() => {
    if (!recording) return;
    startRef.current = performance.now();
    setSamples([]);
    const id = setInterval(() => {
      const t = (performance.now() - startRef.current) / 1000;
      if (t > duration) {
        setRecording(false);
        return;
      }
      setSamples((s) => [...s, { t: +t.toFixed(2), y: +yRef.current.toFixed(3) }]);
    }, RATE_MS);
    return () => clearInterval(id);
  }, [recording, duration]);

  const move = (e) => {
    const r = padRef.current.getBoundingClientRect();
    const v = 1 - (2 * (e.clientY - r.top)) / r.height;
    const c = Math.max(-1, Math.min(1, v));
    yRef.current = c;
    setMarkerY(c);
  };

  const done = !recording && samples.length > 10;
  const err = done && showFit ? rms(samples, p) : NaN;
  const score = Number.isFinite(err) ? Math.max(0, Math.round(100 - err * 200)) : null;

  return (
    <>
      <TopBar title="波の上下トラッカー" chip="a" chipLabel="波" onBack={onBack} />
      <div className="screen">
        <p className="lead">浮いている海藻やブイ、岩に当たる水面など、<b>上下に動くもの</b>を1つ見つけよう。動きに合わせて青い丸を指で上下させると、グラフになる。</p>

        <div className="seg">
          {[20, 40].map((d) => (
            <button key={d} className={duration === d ? 'on' : ''} disabled={recording} onClick={() => setDuration(d)}>{d}秒</button>
          ))}
        </div>

        <div
          ref={padRef}
          className="tracker-pad"
          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); move(e); }}
          onPointerMove={(e) => { if (e.buttons || e.pointerType === 'touch') move(e); }}
        >
          <div className="pad-label">{recording ? `記録中… ${fmt(samples.length ? samples[samples.length - 1].t : 0, 0)} / ${duration}秒` : 'ここを指でなぞる'}</div>
          <div className="center-line" />
          <div className="marker" style={{ top: `${(1 - (markerY + 1) / 2) * 100}%` }} />
        </div>

        {!recording ? (
          <button className="btn" onClick={() => { setShowFit(false); setRecording(true); }}>
            {samples.length ? 'もう一度記録する' : '▶ 記録スタート'}
          </button>
        ) : (
          <button className="btn secondary" onClick={() => setRecording(false)}>■ ここで止める</button>
        )}

        {samples.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <WavePlot samples={samples} fit={showFit ? p : null} duration={recording ? duration : samples[samples.length - 1].t} />
          </div>
        )}

        {done && (
          <div className="card" style={{ marginTop: 12 }}>
            <h3>〰 sin のグラフを重ねてみよう</h3>
            {!showFit ? (
              <>
                <p className="note">グラフの形、何かに似ていない？ 4つの数字を動かして、赤い点線を青い線にぴったり重ねよう。</p>
                <button className="btn" onClick={() => setShowFit(true)}>sin を重ねる</button>
              </>
            ) : (
              <>
                <div className="formula">
                  y = {fmt(p.A, 2)} sin( 2π t / {fmt(p.T, 1)} + {fmt(p.phi, 2)} ) {p.C >= 0 ? '+' : '−'} {fmt(Math.abs(p.C), 2)}
                </div>
                <Slider label="高さ A" min={0} max={1.2} step={0.01} v={p.A} on={(A) => setP({ ...p, A })} show={fmt(p.A, 2)} />
                <Slider label="周期 T" min={1} max={20} step={0.1} v={p.T} on={(T) => setP({ ...p, T })} show={`${fmt(p.T, 1)}s`} />
                <Slider label="ずれ φ" min={0} max={6.28} step={0.01} v={p.phi} on={(phi) => setP({ ...p, phi })} show={`${fmt(p.phi, 2)}`} />
                <Slider label="中心 C" min={-1} max={1} step={0.01} v={p.C} on={(C) => setP({ ...p, C })} show={fmt(p.C, 2)} />
                <div className="result">
                  <div className="label">ぴったり度</div>
                  <div className="value">{score}<span className="unit">点</span></div>
                </div>
                <div className="row">
                  <button className="btn secondary" onClick={() => { const f = autoFit(samples); if (f) setP({ A: f.A, T: f.T, phi: f.phi, C: f.C }); }}>🤖 おまかせ</button>
                  <button className="btn secondary" onClick={() => onSendToArt({ A: p.A, T: p.T, phi: p.phi })}>🎨 アートへ</button>
                </div>
                <p className="note" style={{ marginTop: 8 }}>
                  φ はラジアン（6.28 ≒ 2π で1周）。本物の波はきれいな sin にならない。どこがずれる？なぜ？
                </p>
              </>
            )}
          </div>
        )}

        {done && (
          <SaveBox
            placeholder="動きを追ったもの（例：赤いブイ）"
            onSave={({ name, memo }) =>
              onSave({
                type: 'wave-track',
                name,
                memo,
                summary: showFit
                  ? `y = ${fmt(p.A, 2)} sin(2πt/${fmt(p.T, 1)} + ${fmt(p.phi, 2)}) + ${fmt(p.C, 2)}（ぴったり度 ${score}点）`
                  : `${fmt(samples[samples.length - 1].t, 0)}秒分の波形`,
                data: { ...(showFit ? { A: +fmt(p.A, 3), T: +fmt(p.T, 2), phi: +fmt(p.phi, 3), C: +fmt(p.C, 3), score } : {}), samples },
              })
            }
          />
        )}
      </div>
    </>
  );
}

export function Slider({ label, min, max, step, v, on, show }) {
  return (
    <div className="slider-row">
      <span>{label}</span>
      <input type="range" min={min} max={max} step={step} value={v} onChange={(e) => on(Number(e.target.value))} />
      <span className="v">{show}</span>
    </div>
  );
}
