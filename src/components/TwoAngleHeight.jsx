import { useState } from 'react';
import { TopBar, AngleField, DistanceField, NumField, SaveBox } from './common.jsx';
import { heightTwoAngle, errorRange, fmt, num } from '../math.js';

// 崖や沖の岩など、根元まで行けないものの高さ
export default function TwoAngleHeight({ profile, onBack, onSave }) {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [d, setD] = useState('');
  const [eye, setEye] = useState(profile.eyeHeight || '1.5');

  const A = num(a);
  const B = num(b);
  const D = num(d);
  const E = num(eye) || 0;
  const ok = D > 0 && A > 0 && B > A && B < 90;
  const r = ok ? heightTwoAngle(D, A, B, E) : null;
  const [lo, hi] = ok ? errorRange((x, y) => (y > x && y < 90 ? heightTwoAngle(D, x, y, E).h : NaN), [A, B]) : [NaN, NaN];

  return (
    <>
      <TopBar title="近づけない高さ" chip="b" chipLabel="測量" onBack={onBack} />
      <div className="screen">
        <p className="lead">崖や海の向こうの岩など、根元まで行けないもの。<b>2か所</b>から見上げれば、正弦定理で高さがわかる。</p>
        <Diagram />
        <AngleField label="① 遠い地点Aで見上げる角度 α" value={a} onChange={setA} />
        <DistanceField label="② Aからまっすぐ近づいた距離（A→B）" value={d} onChange={setD} stride={profile.stride} />
        <AngleField label="③ 近い地点Bで見上げる角度 β" value={b} onChange={setB} hint="β は α より大きくなるはず" />
        <NumField label="目の高さ" unit="m" value={eye} onChange={setEye} />

        {B > 0 && A > 0 && B <= A && <div className="warn">β が α より小さい（同じ）よ。BはAより目標に近い地点で測ろう。</div>}

        <div className="result">
          <div className="label">高さ</div>
          <div className="value">{fmt(r?.h, 1)}<span className="unit">m</span></div>
          {ok && <div className="range">角度が±1°ずれると {fmt(lo, 1)}〜{fmt(hi, 1)} m ／ Bから根元まで約 {fmt(r.near, 0)} m</div>}
        </div>

        {ok && (
          <div className="steps">
            <div><b>計算の道すじ</b></div>
            <div>三角形 A・B・てっぺん で、てっぺんの角 ＝ β − α ＝ {fmt(r.apex, 0)}°</div>
            <div>正弦定理：B〜てっぺん ＝ {D} × sin{A}° ÷ sin{fmt(r.apex, 0)}° ＝ {fmt(r.bt, 1)} m</div>
            <div>高さ ＝ {fmt(r.bt, 1)} × sin{B}° ＋ {E} ＝ {fmt(r.h, 1)} m</div>
          </div>
        )}
        {ok && r.apex < 5 && <div className="warn">⚠ β − α が小さい（三角形が細長い）と誤差が大きい。A と B をもっと離そう。</div>}

        <SaveBox
          disabled={!ok}
          placeholder="測ったもの（例：大神子の崖）"
          onSave={({ name, memo }) =>
            onSave({
              type: 'height-two',
              name,
              memo,
              summary: `高さ ${fmt(r.h, 1)}m（α${A}°・β${B}°・AB${D}m、±1°で${fmt(lo, 1)}〜${fmt(hi, 1)}m）`,
              data: { alpha: A, beta: B, distance: D, eye: E, height: +fmt(r.h, 2) },
            })
          }
        />
      </div>
    </>
  );
}

function Diagram() {
  return (
    <svg viewBox="0 0 320 130" style={{ width: '100%', marginBottom: 8 }}>
      <path d="M220 115 L250 20 L300 20 L310 115 Z" fill="#99c6e2" />
      <path d="M180 115 Q200 108 220 115 L320 115 L320 125 L180 125 Z" fill="#cfe9f8" />
      <line x1="10" y1="115" x2="200" y2="115" stroke="#b9cdd8" />
      <line x1="30" y1="115" x2="250" y2="20" stroke="#0068b5" strokeWidth="2" />
      <line x1="120" y1="115" x2="250" y2="20" stroke="#466ca6" strokeWidth="2" />
      <circle cx="30" cy="115" r="4" fill="#323232" />
      <circle cx="120" cy="115" r="4" fill="#323232" />
      <text x="24" y="108" fontSize="12">A</text>
      <text x="114" y="108" fontSize="12">B</text>
      <text x="56" y="110" fontSize="12" fill="#0068b5">α</text>
      <text x="144" y="110" fontSize="12" fill="#466ca6">β</text>
      <text x="75" y="128" fontSize="11" textAnchor="middle">② 距離</text>
      <text x="262" y="14" fontSize="11">てっぺん</text>
    </svg>
  );
}
