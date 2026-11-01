const KEY = 'oomiko-umi:v1';

const defaultState = () => ({
  team: '',
  eyeHeight: '1.5',
  stride: '0.7',
  records: [],
  reflection: '',
});

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    return { ...defaultState(), ...JSON.parse(raw) };
  } catch {
    return defaultState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('保存に失敗しました（容量オーバーの可能性）', e);
  }
}

export function makeId() {
  return `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
