import { useState } from 'react';
import AngleSensor, { requestOrientation } from './AngleSensor.jsx';

export function TopBar({ title, chip, chipLabel, onBack }) {
  return (
    <header className="topbar">
      {onBack && <button className="back" onClick={onBack}>← もどる</button>}
      <h1>{title}</h1>
      {chip && <span className={`chip ${chip}`}>{chipLabel}</span>}
    </header>
  );
}

export function NumField({ label, value, onChange, unit, hint, step = 'any' }) {
  return (
    <div className="field">
      <label>{label}{unit && `（${unit}）`}</label>
      <input type="number" inputMode="decimal" step={step} value={value} onChange={(e) => onChange(e.target.value)} placeholder="例：10" />
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}

// 角度：手入力＋スマホの傾きセンサー（目安）
export function AngleField({ label, value, onChange, mode = 'elevation', hint }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="field">
      <label>{label}（°）</label>
      <div className="row">
        <input type="number" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} placeholder="例：30" />
        <button
          className="btn small secondary"
          style={{ flex: '0 0 auto' }}
          onClick={async () => {
            await requestOrientation();
            setOpen(true);
          }}
        >
          {mode === 'elevation' ? '📐 センサー' : '🧭 方位で測る'}
        </button>
      </div>
      {hint && <div className="hint">{hint}</div>}
      {open && (
        <AngleSensor
          mode={mode}
          onUse={(a) => {
            onChange(String(a));
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

// 距離：メートルで直接入力するか、歩数×歩幅
export function DistanceField({ label, value, onChange, stride, hint }) {
  const [bySteps, setBySteps] = useState(false);
  const [steps, setSteps] = useState('');
  const s = Number(stride) || 0.7;
  return (
    <div className="field">
      <label>{label}（m）</label>
      {bySteps ? (
        <div className="row">
          <input
            type="number"
            inputMode="numeric"
            value={steps}
            placeholder="歩数"
            onChange={(e) => {
              setSteps(e.target.value);
              const n = Number(e.target.value);
              onChange(e.target.value === '' ? '' : String(Math.round(n * s * 10) / 10));
            }}
          />
          <span style={{ flex: '0 0 auto', fontSize: 14 }}>歩 × {s}m ＝ {value || '—'}m</span>
        </div>
      ) : (
        <input type="number" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} placeholder="例：20" />
      )}
      <div className="hint">
        <button className="btn small ghost" style={{ marginTop: 4 }} onClick={() => setBySteps(!bySteps)}>
          {bySteps ? 'メートルで入力する' : '👣 歩数で入力する'}
        </button>
        {hint && <span style={{ marginLeft: 8 }}>{hint}</span>}
      </div>
    </div>
  );
}

export function SaveBox({ onSave, disabled, placeholder = '測ったもの（例：大きな岩）' }) {
  const [name, setName] = useState('');
  const [memo, setMemo] = useState('');
  const [saved, setSaved] = useState(false);
  return (
    <div className="card">
      <div className="field">
        <label>名前</label>
        <input type="text" value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }} placeholder={placeholder} />
      </div>
      <div className="field">
        <label>メモ（気づいたこと）</label>
        <input type="text" value={memo} onChange={(e) => { setMemo(e.target.value); setSaved(false); }} placeholder="例：波が高くてずれた" />
      </div>
      <button
        className="btn"
        disabled={disabled}
        onClick={() => {
          onSave({ name: name || '（名前なし）', memo });
          setSaved(true);
        }}
      >
        記録に保存する
      </button>
      {saved && <div className="saved">保存しました（「記録」から見られます）</div>}
    </div>
  );
}
