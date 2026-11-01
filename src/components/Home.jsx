const PLAN_A = [
  { key: 'timer', icon: '⏱', name: '波の周期タイマー', desc: '波が来るたびにタップ → 周期を出す' },
  { key: 'tracker', icon: '📈', name: '波の上下トラッカー', desc: '上下の動きを指でなぞる → グラフに sin を重ねる' },
  { key: 'circle', icon: '⭕', name: '回転と波', desc: '円を回る点を横から見ると？（一般角・弧度法）' },
];
const PLAN_B = [
  { key: 'height', icon: '📐', name: '高さを測る（tan）', desc: '近づける岩・堤防・灯台の高さ' },
  { key: 'two', icon: '🏔', name: '近づけない高さ', desc: '2か所から見上げて正弦定理で（崖・沖の岩）' },
  { key: 'tri', icon: '🏝', name: '沖までの距離', desc: '浜に基線をとって三角測量（正弦定理）' },
];

export default function Home({ team, onOpen, onEditProfile }) {
  return (
    <div className="screen">
      <div className="hero"><Hero /></div>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
        <div className="note">班：<b style={{ color: 'var(--ink)' }}>{team}</b></div>
        <button className="btn small ghost" style={{ flex: '0 0 auto' }} onClick={onEditProfile}>設定</button>
      </div>

      <div className="section-title">A ― 波をはかる</div>
      <div className="tool-list">
        {PLAN_A.map((t) => <Tool key={t.key} t={t} cls="" onOpen={onOpen} />)}
      </div>

      <div className="section-title">B ― 海で測量</div>
      <div className="tool-list">
        {PLAN_B.map((t) => <Tool key={t.key} t={t} cls="b" onOpen={onOpen} />)}
      </div>

      <div className="section-title">ART ― 波をデザイン</div>
      <div className="tool-list">
        <Tool t={{ key: 'art', icon: '🎨', name: '波のアート', desc: 'sin を重ねて海の模様をつくる・画像で保存' }} cls="art" onOpen={onOpen} />
      </div>

      <p className="note">電波がなくても使えます。記録はこのスマホの中に保存されます。</p>
    </div>
  );
}

function Tool({ t, cls, onOpen }) {
  return (
    <button className={`tool ${cls}`} onClick={() => onOpen(t.key)}>
      <span className="icon">{t.icon}</span>
      <span>
        <div className="name">{t.name}</div>
        <div className="desc">{t.desc}</div>
      </span>
    </button>
  );
}

// 空・島影・海の3層を sin の波で描いたヘッダー
function Hero() {
  const W = 480;
  const path = (base, amp, k, phi) => {
    let d = `M0,${base}`;
    for (let x = 0; x <= W; x += 8) d += `L${x},${(base + amp * Math.sin((k * x * 2 * Math.PI) / W + phi)).toFixed(1)}`;
    return `${d}L${W},200L0,200Z`;
  };
  return (
    <svg viewBox={`0 0 ${W} 200`} preserveAspectRatio="none">
      <rect width={W} height="200" fill="#cfe9f8" />
      <path d="M300,110 Q340,70 380,88 Q420,60 480,96 L480,200 L300,200Z" fill="#4091a4" opacity="0.55" />
      <path d={path(118, 5, 3, 0)} fill="#99c6e2" />
      <path d={path(140, 7, 2, 1.2)} fill="#32a7c7" />
      <path d={path(162, 6, 4, 2.5)} fill="#227ea5" />
      <path d={path(182, 4, 6, 0.6)} fill="#0068b5" />
      <text x="20" y="46" fontSize="13" fill="#323232" letterSpacing="4">OOMIKO  SEA  MATH  LAB</text>
      <text x="20" y="80" fontSize="28" fontWeight="700" fill="#323232">大神子 海の数学ラボ</text>
    </svg>
  );
}
