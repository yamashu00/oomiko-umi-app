import { useEffect, useRef, useState } from 'react';

// iOS はボタンを押した直後にしか許可ダイアログを出せないので、クリック時に呼ぶ
export async function requestOrientation() {
  try {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      return (await DeviceOrientationEvent.requestPermission()) === 'granted';
    }
  } catch {
    return false;
  }
  return true;
}

function headingOf(e) {
  if (typeof e.webkitCompassHeading === 'number') return e.webkitCompassHeading;
  if (e.absolute && typeof e.alpha === 'number') return (360 - e.alpha) % 360;
  return null;
}

// mode = 'elevation'：見上げる角度（スマホの長い辺に沿って目標を見る）
// mode = 'heading'：2方向の方位の差（水平の角度）
export default function AngleSensor({ mode, onUse, onClose }) {
  const [value, setValue] = useState(null);
  const [frozen, setFrozen] = useState(null);
  const [first, setFirst] = useState(null);
  const [error, setError] = useState('');
  const buf = useRef([]);

  useEffect(() => {
    if (typeof DeviceOrientationEvent === 'undefined') {
      setError('この端末はセンサーに対応していないみたい。手入力してね。');
      return;
    }
    let got = false;
    const handler = (e) => {
      let v = null;
      if (mode === 'elevation') {
        if (e.beta == null) return;
        v = Math.max(0, Math.min(89, e.beta));
      } else {
        v = headingOf(e);
        if (v == null) return;
      }
      got = true;
      buf.current.push(v);
      if (buf.current.length > 8) buf.current.shift();
      // 方位は 359°→0° をまたぐので平均せず最新値を使う
      setValue(mode === 'elevation' ? buf.current.reduce((a, b) => a + b, 0) / buf.current.length : v);
    };
    window.addEventListener('deviceorientation', handler);
    window.addEventListener('deviceorientationabsolute', handler);
    const t = setTimeout(() => {
      if (!got) setError(mode === 'heading'
        ? '方位がとれなかったよ。紙の分度器で測って手入力してね。'
        : 'センサーの値がとれなかったよ。手入力してね。');
    }, 2500);
    return () => {
      clearTimeout(t);
      window.removeEventListener('deviceorientation', handler);
      window.removeEventListener('deviceorientationabsolute', handler);
    };
  }, [mode]);

  const shown = frozen ?? value;
  const diff = first != null && value != null ? (() => {
    let d = Math.abs(value - first) % 360;
    return d > 180 ? 360 - d : d;
  })() : null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {mode === 'elevation' ? (
          <>
            <h3>📐 見上げる角度センサー（目安）</h3>
            <p className="note">
              スマホの画面を上に向け、<b>長い辺に沿って</b>望遠鏡のようにのぞき、上の端を目標のてっぺんに合わせる。合ったら「止める」。
            </p>
            {error ? <div className="warn">{error}</div> : (
              <div className="result">
                <div className="value">{shown != null ? `${Math.round(shown)}°` : '…'}</div>
                <div className="label">{frozen != null ? '止めた値' : '動かすと変わります'}</div>
              </div>
            )}
            {!error && (frozen == null
              ? <button className="btn secondary" disabled={value == null} onClick={() => setFrozen(value)}>⏸ 止める</button>
              : <button className="btn secondary" onClick={() => setFrozen(null)}>もう一度測る</button>)}
            <button className="btn" disabled={shown == null || !!error} onClick={() => onUse(Math.round(shown))}>この角度を使う</button>
          </>
        ) : (
          <>
            <h3>🧭 方位で角度を測る（目安）</h3>
            <p className="note">
              スマホを水平に持ち、上の端を向ける。①相手の地点に向けて「記録」→ ②目標に向けて「記録」。2つの方位の差が角度になる。
              <b>近くに金属や車があるとずれる</b>ので、紙の分度器でも測って比べよう。
            </p>
            {error ? <div className="warn">{error}</div> : (
              <div className="result">
                <div className="value">{value != null ? `${Math.round(value)}°` : '…'}</div>
                <div className="label">いまの方位（北が0°）</div>
                {first != null && <div className="range">① {Math.round(first)}° → いまとの差 <b>{diff != null ? Math.round(diff) : '—'}°</b></div>}
              </div>
            )}
            {first == null
              ? <button className="btn secondary" disabled={value == null} onClick={() => setFirst(value)}>① 相手の地点に向けて記録</button>
              : <button className="btn" disabled={diff == null} onClick={() => onUse(Math.round(diff))}>② 目標に向けて記録（{diff != null ? Math.round(diff) : '—'}° を使う）</button>}
            {first != null && <button className="btn secondary" onClick={() => setFirst(null)}>①からやり直す</button>}
          </>
        )}
        <button className="btn ghost" onClick={onClose}>手入力する</button>
      </div>
    </div>
  );
}
