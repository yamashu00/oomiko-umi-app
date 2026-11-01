import { useState } from 'react';
import { TopBar, AngleField, DistanceField, SaveBox } from './common.jsx';
import { triangulate, errorRange, fmt, num, rad } from '../math.js';

// 浜辺に基線ABをとり、沖の目標Cまでの距離を正弦定理で求める（三角測量）
export default function Triangulate({ profile, onBack, onSave }) {
  const [d, setD] = useState('');
  const [a, setA] = useState('');
  const [b, setB] = useState('');

  const D = num(d);
  const A = num(a);
  const B = num(b);
  const ok = D > 0 && A > 0 && B > 0 && A + B < 180;
  const r = ok ? triangulate(D, A, B) : null;
  const [lo, hi] = ok ? errorRange((x, y) => (x + y < 180 ? triangulate(D, x, y).perp : NaN), [A, B]) : [NaN, NaN];

  return (
    <>
      <TopBar title="沖までの距離" chip="b" chipLabel="測量" onBack={onBack} />
      <div className="screen">
        <p className="lead">海の上の岩・ブイ・島など、歩いて行けないものまでの距離。浜辺に2つの地点A・Bをとって<b>三角形</b>をつくる。</p>
        <Diagram r={r} A={A} B={B} />
        <DistanceField label="① 基線 AB の長さ" value={d} onChange={setD} stride={profile.stride} hint="長いほど正確" />
        <AngleField label="② 地点Aでの角度（Bの方向と目標の間）" value={a} onChange={setA} mode="heading" />
        <AngleField label="③ 地点Bでの角度（Aの方向と目標の間）" value={b} onChange={setB} mode="heading" />

        {A > 0 && B > 0 && A + B >= 180 && <div className="warn">∠A＋∠B が180°以上だと三角形にならないよ。</div>}

        <div className="result">
          <div className="label">浜（基線）から目標までの距離</div>
          <div className="value">{fmt(r?.perp, 0)}<span className="unit">m</span></div>
          {ok && <div className="range">角度が±1°ずれると {fmt(lo, 0)}〜{fmt(hi, 0)} m</div>}
        </div>

        {ok && (
          <div className="steps">
            <div><b>計算の道すじ</b></div>
            <div>∠C ＝ 180° − {A}° − {B}° ＝ {fmt(r.C, 0)}°</div>
            <div>正弦定理：AC ／ sin B ＝ AB ／ sin C</div>
            <div>AC ＝ {D} × sin{B}° ÷ sin{fmt(r.C, 0)}° ＝ {fmt(r.ac, 1)} m</div>
            <div>浜からの距離 ＝ AC × sin{A}° ＝ {fmt(r.perp, 1)} m</div>
          </div>
        )}
        {ok && r.C < 10 && <div className="warn">⚠ ∠C が小さい（目標が遠くて三角形が細長い）と誤差が大きい。基線ABを長くしよう。</div>}

        <SaveBox
          disabled={!ok}
          placeholder="目標（例：沖の岩）"
          onSave={({ name, memo }) =>
            onSave({
              type: 'triangulate',
              name,
              memo,
              summary: `距離 ${fmt(r.perp, 0)}m（AB${D}m・∠A${A}°・∠B${B}°、±1°で${fmt(lo, 0)}〜${fmt(hi, 0)}m）`,
              data: { baseline: D, angleA: A, angleB: B, angleC: +fmt(r.C, 1), AC: +fmt(r.ac, 1), distance: +fmt(r.perp, 1) },
            })
          }
        />
      </div>
    </>
  );
}

// 入力した角度で三角形の形を描く（入力前は見本の形）。遠いときは形を保ったまま縮める
function Diagram({ r, A, B }) {
  const aa = r ? A : 60;
  const bb = r ? B : 70;
  const y0 = 140;
  const top = 12;
  const left = 30;
  const right = 290;
  // A=(0,0)・B=(1,0) としてCの位置を出す
  const ac = Math.sin(rad(bb)) / Math.sin(rad(180 - aa - bb));
  const ux = ac * Math.cos(rad(aa));
  const uy = ac * Math.sin(rad(aa));
  const minX = Math.min(0, ux);
  const maxX = Math.max(1, ux);
  // 基線は最低70px。それでも入りきらないほど遠いときは、上を切って「とても遠い」と表示する
  const scale = Math.max(70, Math.min((right - left) / (maxX - minX), (y0 - top) / uy));
  const clipped = uy * scale > y0 - top;
  const span = Math.min(maxX - minX, (right - left) / scale);
  const ox = left + (right - left - span * scale) / 2 - Math.max(minX, Math.min(0, ux - span + 1)) * scale;
  const P = (x, y) => [ox + x * scale, y0 - y * scale];
  const [ax, ay] = P(0, 0);
  const [bx] = P(1, 0);
  const [cx0, cy0] = P(ux, uy);
  // 枠の上端 y=top で辺 AC・BC を切る
  const cut = (x0) => x0 + ((cx0 - x0) * (ay - top)) / (ay - cy0);
  const pts = clipped
    ? `${ax},${ay} ${bx},${ay} ${cut(bx)},${top} ${cut(ax)},${top}`
    : `${ax},${ay} ${bx},${ay} ${cx0},${cy0}`;
  const cx = clipped ? (cut(ax) + cut(bx)) / 2 : cx0;
  const cy = clipped ? top : cy0;
  const labelLeft = cx > 220;
  return (
    <svg viewBox="0 0 320 170" style={{ width: '100%', marginBottom: 8 }}>
      <rect x="0" y="0" width="320" height="150" fill="#cfe9f8" />
      <rect x="0" y="140" width="320" height="30" fill="#f3ead7" />
      <polygon points={pts} fill="rgba(0,104,181,0.08)" stroke="#0068b5" strokeWidth="2" />
      <circle cx={ax} cy={ay} r="4" fill="#323232" />
      <circle cx={bx} cy={ay} r="4" fill="#323232" />
      {!clipped && <circle cx={cx} cy={cy} r="6" fill="#aa6255" />}
      <text x={ax - 4} y={ay + 18} fontSize="12">A</text>
      <text x={bx - 4} y={ay + 18} fontSize="12">B</text>
      <text x={labelLeft ? cx - 9 : cx + 9} y={cy + 6} fontSize="12" textAnchor={labelLeft ? 'end' : 'start'}>
        {clipped ? '↑ C はとても遠い' : 'C（目標）'}
      </text>
      <text x={(ax + bx) / 2} y={ay + 18} fontSize="11" textAnchor="middle">① 基線</text>
      <text x={ax + 10} y={ay - 6} fontSize="12" fill="#0068b5">②</text>
      <text x={bx - 22} y={ay - 6} fontSize="12" fill="#0068b5">③</text>
    </svg>
  );
}
