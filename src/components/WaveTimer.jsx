import { useState } from 'react';
import { TopBar, SaveBox } from './common.jsx';
import { fmt } from '../math.js';

// 波が目印を通るたびにタップ → 間隔から周期を出す
export default function WaveTimer({ onBack, onSave }) {
  const [taps, setTaps] = useState([]);

  const intervals = taps.slice(1).map((t, i) => (t - taps[i]) / 1000);
  const sorted = [...intervals].sort((a, b) => a - b);
  const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : NaN;
  // 中央値の1.7倍を超える間隔は「1回見逃した」可能性が高いので平均から外す
  const used = intervals.filter((x) => x <= median * 1.7);
  const T = used.length ? used.reduce((a, b) => a + b, 0) / used.length : NaN;

  return (
    <>
      <TopBar title="波の周期タイマー" chip="a" chipLabel="波" onBack={onBack} />
      <div className="screen">
        <p className="lead">岩や杭など<b>目印</b>を1つ決めて、波の山がそこを通るたびにボタンを押そう。10回以上がめやす。</p>
        <button
          className="tap-big"
          onPointerDown={(e) => {
            e.preventDefault();
            setTaps((t) => [...t, performance.now()]);
          }}
        >
          🌊 波が来た！
          <div style={{ fontSize: 16, fontWeight: 400 }}>{taps.length} 回</div>
        </button>
        <div className="row" style={{ marginTop: 8 }}>
          <button className="btn secondary" disabled={!taps.length} onClick={() => setTaps((t) => t.slice(0, -1))}>1回取り消す</button>
          <button className="btn secondary" disabled={!taps.length} onClick={() => setTaps([])}>リセット</button>
        </div>

        <div className="result">
          <div className="label">周期 T（波が1回来るのにかかる時間）</div>
          <div className="value">{fmt(T, 1)}<span className="unit">秒</span></div>
          {Number.isFinite(T) && (
            <div className="range">
              1分間に約 <b>{fmt(60 / T, 0)}</b> 回 ／ 1秒あたり <b>{fmt((2 * Math.PI) / T, 2)}</b> rad 回る回転と同じリズム
            </div>
          )}
        </div>

        {intervals.length > 0 && (
          <div className="card">
            <h3>間隔の記録</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 14 }}>
              {intervals.map((x, i) => (
                <span key={i} style={{ padding: '2px 8px', borderRadius: 9999, background: x > median * 1.7 ? 'var(--warn)' : 'var(--sea-light)' }}>
                  {fmt(x, 1)}s
                </span>
              ))}
            </div>
            {intervals.some((x) => x > median * 1.7) && <div className="note" style={{ marginTop: 6 }}>黄色は長すぎる間隔（見逃し？）なので平均から外しています。</div>}
          </div>
        )}

        <div className="card tint">
          <h3>💭 考えてみよう</h3>
          <div className="note">・同じ場所で測った他の班と同じ値になる？ ・「1周＝2π rad」とすると、波は1秒に何 rad 進む？</div>
        </div>

        <SaveBox
          placeholder="目印（例：桟橋の杭）"
          disabled={!Number.isFinite(T)}
          onSave={({ name, memo }) =>
            onSave({
              type: 'wave-period',
              name,
              memo,
              summary: `周期 ${fmt(T, 1)}秒（${taps.length}回タップ）`,
              data: { T: +fmt(T, 2), taps: taps.length, intervals: intervals.map((x) => +fmt(x, 2)) },
            })
          }
        />
      </div>
    </>
  );
}
