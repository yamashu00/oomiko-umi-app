import { useEffect, useRef, useState } from 'react';
import { TopBar, SaveBox } from './common.jsx';
import { Slider } from './WaveTracker.jsx';
import { fmt } from '../math.js';

const PALETTES = {
  umi: { name: '瀬戸内の海', stops: ['#e9f2fc', '#99c6e2', '#32a7c7', '#227ea5', '#0068b5', '#1d3557'] },
  yuhi: { name: '夕ぐれ', stops: ['#f5f57f', '#f2c48d', '#aa6255', '#7a4b6b', '#466ca6', '#1d2b4f'] },
  iso: { name: '磯', stops: ['#f3ead7', '#c9dcc2', '#2f837b', '#3a7b98', '#2e4f5c', '#1f2d2a'] },
};

const SIZE = 1080;

function mix(a, b, t) {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(',')})`;
}

function colorAt(stops, t) {
  const s = Math.min(0.9999, Math.max(0, t)) * (stops.length - 1);
  const i = Math.floor(s);
  return mix(stops[i], stops[i + 1], s - i);
}

// 重ねた sin の合計（波の重ね合わせ）
function wave(layers, x, shift) {
  return layers.reduce((sum, l) => (l.on ? sum + l.A * Math.sin(l.k * x + l.phi + shift) : sum), 0);
}

function draw(ctx, { layers, bands, drift, palette, shape, title }) {
  const stops = PALETTES[palette].stops;
  const H = SIZE;
  const art = SIZE - 140; // 下の140pxは作品カードの文字
  ctx.fillStyle = stops[0];
  ctx.fillRect(0, 0, SIZE, H);

  if (shape === 'stripe') {
    const bandH = art / bands;
    for (let j = 0; j <= bands; j++) {
      ctx.beginPath();
      for (let px = 0; px <= SIZE; px += 6) {
        const x = (px / SIZE) * 2 * Math.PI;
        const y = j * bandH + bandH * 1.2 * wave(layers, x, j * drift);
        px === 0 ? ctx.moveTo(px, y) : ctx.lineTo(px, y);
      }
      ctx.lineTo(SIZE, art);
      ctx.lineTo(0, art);
      ctx.closePath();
      ctx.fillStyle = colorAt(stops, j / bands);
      ctx.fill();
    }
  } else {
    const cx = SIZE / 2;
    const cy = art / 2;
    const Rmax = art * 0.48;
    for (let j = bands; j >= 1; j--) {
      const r0 = (Rmax * j) / bands;
      ctx.beginPath();
      for (let i = 0; i <= 360; i++) {
        const th = (i / 360) * 2 * Math.PI;
        const r = r0 * (1 + 0.18 * wave(layers, th, j * drift));
        const x = cx + r * Math.cos(th);
        const y = cy - r * Math.sin(th);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = colorAt(stops, 1 - j / bands);
      ctx.fill();
    }
  }

  // 作品カード：タイトルと式
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, art, SIZE, H - art);
  ctx.fillStyle = '#323232';
  ctx.font = 'bold 44px "Hiragino Kaku Gothic ProN", sans-serif';
  ctx.fillText(title || '無題', 48, art + 62);
  ctx.font = '28px "Times New Roman", serif';
  ctx.fillStyle = '#6d7682';
  ctx.fillText(formulaText(layers, shape), 48, art + 108);
  ctx.font = '22px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('大神子 海の数学ラボ', SIZE - 48, art + 108);
  ctx.textAlign = 'left';
}

function formulaText(layers, shape) {
  const v = shape === 'stripe' ? 'x' : 'θ';
  const terms = layers.filter((l) => l.on).map((l) => `${fmt(l.A, 2)} sin(${l.k}${v} + ${fmt(l.phi, 1)})`);
  return `${shape === 'stripe' ? 'y' : 'r'} = ${terms.join(' + ') || '0'}`;
}

export default function WaveArt({ team, seed, onBack, onSave }) {
  const canvasRef = useRef(null);
  const [shape, setShape] = useState('stripe');
  const [palette, setPalette] = useState('umi');
  const [bands, setBands] = useState(12);
  const [drift, setDrift] = useState(0.35);
  const [title, setTitle] = useState('');
  const [layers, setLayers] = useState(() => {
    const base = [
      { A: 0.6, k: 2, phi: 0, on: true },
      { A: 0.25, k: 5, phi: 1.0, on: true },
      { A: 0.1, k: 11, phi: 0, on: false },
    ];
    // トラッカーで重ねた波を1本目に入れる（周期が短いほど細かい波）
    if (seed) base[0] = { A: Math.min(1, seed.A), k: Math.max(1, Math.min(12, Math.round(20 / seed.T))), phi: seed.phi, on: true, fromTracker: true };
    return base;
  });

  const params = { layers, bands, drift, palette, shape, title: title || (team ? `${team}の海` : '') };

  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    draw(ctx, params);
  });

  const setLayer = (i, patch) => setLayers((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  const savePng = () => {
    canvasRef.current.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `umi-art-${Date.now()}.png`, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], title: params.title }); return; } catch { /* キャンセル時はダウンロードへ */ }
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = file.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    }, 'image/png');
  };

  return (
    <>
      <TopBar title="波のアート" chip="art" chipLabel="アート" onBack={onBack} />
      <div className="screen">
        <p className="lead">sin の波を重ねて、海の模様をデザインしよう。<b>A＝高さ、k＝波の数、φ＝ずれ</b>。数字を動かすと模様がどう変わる？</p>
        <canvas ref={canvasRef} width={SIZE} height={SIZE} style={{ width: '100%', borderRadius: 12, border: '1px solid var(--line)' }} />

        <div className="seg" style={{ marginTop: 10 }}>
          <button className={shape === 'stripe' ? 'on' : ''} onClick={() => setShape('stripe')}>〰 しま模様</button>
          <button className={shape === 'ring' ? 'on' : ''} onClick={() => setShape('ring')}>◎ 波紋・貝</button>
        </div>

        {layers.map((l, i) => (
          <div className="card" key={i} style={{ opacity: l.on ? 1 : 0.6 }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0 }}>波 {i + 1}{l.fromTracker && '（トラッカーの波）'}</h3>
              <button className="btn small secondary" style={{ flex: '0 0 auto' }} onClick={() => setLayer(i, { on: !l.on })}>{l.on ? 'ON' : 'OFF'}</button>
            </div>
            {l.on && (
              <>
                <Slider label="高さ A" min={0} max={1} step={0.01} v={l.A} on={(A) => setLayer(i, { A })} show={fmt(l.A, 2)} />
                <Slider label="波の数 k" min={1} max={12} step={1} v={l.k} on={(k) => setLayer(i, { k })} show={l.k} />
                <Slider label="ずれ φ" min={0} max={6.28} step={0.01} v={l.phi} on={(phi) => setLayer(i, { phi })} show={fmt(l.phi, 2)} />
              </>
            )}
          </div>
        ))}

        <div className="card">
          <Slider label="層の数" min={4} max={28} step={1} v={bands} on={setBands} show={bands} />
          <Slider label="ねじれ" min={0} max={1.5} step={0.01} v={drift} on={setDrift} show={fmt(drift, 2)} />
          <div className="field" style={{ marginTop: 8 }}>
            <label>色</label>
            <div className="color-dots">
              {Object.entries(PALETTES).map(([key, p]) => (
                <button key={key} className={palette === key ? 'on' : ''} aria-label={p.name}
                  style={{ background: `linear-gradient(135deg, ${p.stops[1]}, ${p.stops[4]})` }}
                  onClick={() => setPalette(key)} />
              ))}
              <span className="note" style={{ alignSelf: 'center' }}>{PALETTES[palette].name}</span>
            </div>
          </div>
          <div className="field">
            <label>作品タイトル</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={team ? `${team}の海` : '例：大神子の朝'} />
          </div>
          <button className="btn" onClick={savePng}>🖼 画像として保存</button>
        </div>

        <div className="formula" style={{ fontSize: 15 }}>{formulaText(layers, shape)}</div>

        <SaveBox
          placeholder="作品名（記録用）"
          onSave={({ name, memo }) =>
            onSave({
              type: 'art',
              name: title || name,
              memo,
              summary: formulaText(layers, shape),
              data: { shape, palette, bands, drift, layers: layers.filter((l) => l.on).map(({ A, k, phi }) => ({ A, k, phi })) },
            })
          }
        />
      </div>
    </>
  );
}
