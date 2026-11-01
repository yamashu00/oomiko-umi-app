import { useState } from 'react';
import { TopBar, AngleField, DistanceField, NumField, SaveBox } from './common.jsx';
import { heightTan, errorRange, fmt, num } from '../math.js';

export default function HeightTan({ profile, onBack, onSave }) {
  const [d, setD] = useState('');
  const [a, setA] = useState('');
  const [eye, setEye] = useState(profile.eyeHeight || '1.5');

  const D = num(d);
  const Aa = num(a);
  const E = num(eye) || 0;
  const ok = D > 0 && Aa > 0 && Aa < 90;
  const h = ok ? heightTan(D, Aa, E) : NaN;
  const [lo, hi] = ok ? errorRange((x) => (x < 90 ? heightTan(D, x, E) : NaN), [Aa]) : [NaN, NaN];

  return (
    <>
      <TopBar title="高さを測る（tan）" chip="b" chipLabel="測量" onBack={onBack} />
      <div className="screen">
        <p className="lead">根元まで近づける岩・堤防・灯台などの高さ。岳人の森と同じ方法。</p>
        <Diagram />
        <DistanceField label="① 根元までの距離" value={d} onChange={setD} stride={profile.stride} />
        <AngleField label="② てっぺんを見上げる角度" value={a} onChange={setA} />
        <NumField label="③ 目の高さ" unit="m" value={eye} onChange={setEye} />

        <div className="result">
          <div className="label">高さ ＝ 距離 × tanθ ＋ 目の高さ</div>
          <div className="value">{fmt(h, 1)}<span className="unit">m</span></div>
          {ok && <div className="range">角度が±1°ずれると {fmt(lo, 1)}〜{fmt(hi, 1)} m</div>}
        </div>
        {ok && Aa >= 70 && (
          <div className="warn">⚠ 角度が90°に近いと、少しのずれで高さが大きく変わる（岳人の森の「59mの木」）。もっと離れて、45°くらいで測り直そう。</div>
        )}

        <SaveBox
          disabled={!ok}
          onSave={({ name, memo }) =>
            onSave({
              type: 'height-tan',
              name,
              memo,
              summary: `高さ ${fmt(h, 1)}m（距離${D}m・${Aa}°、±1°で${fmt(lo, 1)}〜${fmt(hi, 1)}m）`,
              data: { distance: D, angle: Aa, eye: E, height: +fmt(h, 2) },
            })
          }
        />
      </div>
    </>
  );
}

function Diagram() {
  return (
    <svg viewBox="0 0 320 120" style={{ width: '100%', marginBottom: 8 }}>
      <line x1="10" y1="105" x2="310" y2="105" stroke="#b9cdd8" />
      <rect x="260" y="20" width="26" height="85" fill="#99c6e2" />
      <line x1="40" y1="90" x2="273" y2="20" stroke="#0068b5" strokeWidth="2" />
      <line x1="40" y1="90" x2="273" y2="90" stroke="#323232" strokeDasharray="4 3" />
      <line x1="40" y1="90" x2="40" y2="105" stroke="#323232" strokeWidth="3" />
      <text x="150" y="102" fontSize="12" fill="#323232" textAnchor="middle">① 距離</text>
      <text x="80" y="84" fontSize="12" fill="#0068b5">② θ</text>
      <text x="6" y="100" fontSize="11" fill="#323232">③</text>
      <text x="292" y="60" fontSize="12" fill="#323232">高さ？</text>
    </svg>
  );
}
