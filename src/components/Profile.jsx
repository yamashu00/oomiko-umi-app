import { useState } from 'react';

export default function Profile({ initial, onDone }) {
  const [team, setTeam] = useState(initial.team);
  const [eye, setEye] = useState(initial.eyeHeight);
  const [stride, setStride] = useState(initial.stride);
  return (
    <div className="screen">
      <h2>はじめに</h2>
      <p className="lead">班の情報を入れてね（あとから「設定」で変えられます）。</p>
      <div className="field">
        <label>班の名前</label>
        <input type="text" value={team} onChange={(e) => setTeam(e.target.value)} placeholder="例：3班" />
      </div>
      <div className="field">
        <label>目の高さ（m）</label>
        <input type="number" inputMode="decimal" value={eye} onChange={(e) => setEye(e.target.value)} />
        <div className="hint">身長 − 0.1m くらい</div>
      </div>
      <div className="field">
        <label>歩幅（m）</label>
        <input type="number" inputMode="decimal" value={stride} onChange={(e) => setStride(e.target.value)} />
        <div className="hint">10歩あるいた距離 ÷ 10。浜でメジャーがないときに使う</div>
      </div>
      <button className="btn" disabled={!team.trim()} onClick={() => onDone({ team: team.trim(), eyeHeight: eye, stride })}>はじめる</button>
    </div>
  );
}
