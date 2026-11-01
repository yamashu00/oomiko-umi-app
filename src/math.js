export const rad = (d) => (d * Math.PI) / 180;
export const deg = (r) => (r * 180) / Math.PI;

export const fmt = (x, n = 1) => (Number.isFinite(x) ? x.toFixed(n) : '—');
export const num = (v) => (v === '' || v == null ? NaN : Number(v));

// 高さ = 距離 × tanθ + 目の高さ
export function heightTan(d, a, eye) {
  return d * Math.tan(rad(a)) + eye;
}

// 遠い地点Aで仰角a、d m近づいた地点Bで仰角b（b > a）
// 三角形 A・B・てっぺん で、てっぺんの角は b − a。正弦定理で B〜てっぺん の長さを出す
export function heightTwoAngle(d, a, b, eye) {
  const apex = b - a;
  const bt = (d * Math.sin(rad(a))) / Math.sin(rad(apex));
  return { apex, bt, h: bt * Math.sin(rad(b)) + eye, near: bt * Math.cos(rad(b)) };
}

// 基線AB = d、∠A・∠B から目標Cまでの距離（正弦定理）
export function triangulate(d, A, B) {
  const C = 180 - A - B;
  const ac = (d * Math.sin(rad(B))) / Math.sin(rad(C));
  const bc = (d * Math.sin(rad(A))) / Math.sin(rad(C));
  return { C, ac, bc, perp: ac * Math.sin(rad(A)) };
}

// 角度がそれぞれ ±1° ずれたときの結果の範囲
export function errorRange(fn, angles, delta = 1) {
  let lo = Infinity;
  let hi = -Infinity;
  const combos = 3 ** angles.length;
  for (let k = 0; k < combos; k++) {
    let m = k;
    const shifted = angles.map((a) => {
      const s = (m % 3) - 1;
      m = Math.floor(m / 3);
      return a + s * delta;
    });
    const v = fn(...shifted);
    if (Number.isFinite(v) && v > 0) {
      lo = Math.min(lo, v);
      hi = Math.max(hi, v);
    }
  }
  return [lo, hi];
}

// 波形データに y = A sin(2π t / T + φ) + C を当てはめる（おまかせボタン用）
export function autoFit(samples) {
  if (samples.length < 10) return null;
  const ys = samples.map((s) => s.y);
  const C = ys.reduce((a, b) => a + b, 0) / ys.length;
  const sorted = [...ys].sort((a, b) => a - b);
  const p = (q) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
  const A = Math.max(0.05, (p(0.95) - p(0.05)) / 2);

  // 中心線を下から上へ横切る時刻の間隔から周期のあたりをつける
  const ups = [];
  let below = samples[0].y < C;
  for (const s of samples) {
    if (below && s.y > C + 0.15 * A) {
      ups.push(s.t);
      below = false;
    } else if (!below && s.y < C - 0.15 * A) {
      below = true;
    }
  }
  const duration = samples[samples.length - 1].t - samples[0].t;
  const T0 = ups.length >= 2 ? (ups[ups.length - 1] - ups[0]) / (ups.length - 1) : duration / 2;

  let best = { A, C, T: T0, phi: 0, err: Infinity };
  for (let i = -10; i <= 10; i++) {
    const T = T0 * (1 + i * 0.03);
    if (T <= 0.2) continue;
    for (let j = 0; j < 72; j++) {
      const phi = (j / 72) * 2 * Math.PI;
      const err = sse(samples, { A, C, T, phi });
      if (err < best.err) best = { A, C, T, phi, err };
    }
  }
  return best;
}

export function model({ A, C, T, phi }, t) {
  return A * Math.sin((2 * Math.PI * t) / T + phi) + C;
}

function sse(samples, p) {
  let e = 0;
  for (const s of samples) {
    const d = s.y - model(p, s.t);
    e += d * d;
  }
  return e;
}

export function rms(samples, p) {
  if (!samples.length) return NaN;
  return Math.sqrt(sse(samples, p) / samples.length);
}
