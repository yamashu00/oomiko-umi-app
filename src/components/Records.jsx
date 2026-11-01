import { useState } from 'react';
import { TopBar } from './common.jsx';

export const TYPE_LABEL = {
  'wave-period': '⏱ 波の周期',
  'wave-track': '📈 波の上下',
  'height-tan': '📐 高さ（tan）',
  'height-two': '🏔 近づけない高さ',
  triangulate: '🏝 沖までの距離',
  art: '🎨 波のアート',
};

function csvCell(v) {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function download(name, text) {
  const blob = new Blob(['﻿' + text], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

export default function Records({ state, onDelete, onReflection }) {
  const [confirmId, setConfirmId] = useState(null);
  const { records } = state;

  const exportAll = () => {
    const head = ['班', '日時', '種類', '名前', '結果', 'メモ', '緯度', '経度', 'データ'];
    const rows = records.map((r) => {
      const { samples, ...rest } = r.data || {};
      return [r.team, r.createdAt, TYPE_LABEL[r.type], r.name, r.summary, r.memo, r.lat, r.lng, JSON.stringify(rest)];
    });
    if (state.reflection) rows.push([state.team, new Date().toISOString(), '振り返り', '', '', state.reflection, '', '', '']);
    download(`oomiko-${state.team}-${Date.now()}.csv`, [head, ...rows].map((r) => r.map(csvCell).join(',')).join('\n'));
  };

  const exportSamples = (r) => {
    const lines = ['時間(秒),高さ(-1〜1)', ...r.data.samples.map((s) => `${s.t},${s.y}`)];
    download(`wave-${state.team}-${r.name}.csv`, lines.join('\n'));
  };

  return (
    <>
      <TopBar title="記録" />
      <div className="screen">
        {records.length === 0 && <p className="lead">まだ記録がありません。測ったら「記録に保存する」を押そう。</p>}
        {records.map((r) => (
          <div className="record" key={r.id}>
            <div className="meta">
              {TYPE_LABEL[r.type]} ・ {new Date(r.createdAt).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              {r.lat != null && ' ・ 📍'}
            </div>
            <div className="title">{r.name}</div>
            <div className="sum">{r.summary}</div>
            {r.memo && <div className="note">メモ：{r.memo}</div>}
            <div className="row" style={{ marginTop: 6, justifyContent: 'flex-end', gap: 6 }}>
              {r.data?.samples && <button className="btn small secondary" style={{ flex: '0 0 auto' }} onClick={() => exportSamples(r)}>波形CSV</button>}
              {confirmId === r.id ? (
                <button className="btn small danger" style={{ flex: '0 0 auto' }} onClick={() => { onDelete(r.id); setConfirmId(null); }}>本当に消す</button>
              ) : (
                <button className="btn small ghost" style={{ flex: '0 0 auto' }} onClick={() => setConfirmId(r.id)}>削除</button>
              )}
            </div>
          </div>
        ))}

        <div className="card tint">
          <h3>気づき・発見・疑問</h3>
          <textarea value={state.reflection} onChange={(e) => onReflection(e.target.value)} placeholder="今日いちばん驚いたこと、うまく測れなかったこと、次に知りたいこと" />
        </div>

        <button className="btn" disabled={!records.length && !state.reflection} onClick={exportAll}>📤 CSVで書き出す（先生に提出）</button>
        <p className="note">書き出したファイルを Google ドライブや Classroom にアップロードしてください。</p>
      </div>
    </>
  );
}
