// Reconhecedor de sinais ISOLADOS por vizinho mais próximo sobre sequências reamostradas.
// Lógica pura (sem DOM) para poder ser testada com Node.
export const FRAMES = 16;
export const MIN_SAMPLES = 3;
export interface SignData { id: string; label: string; validated: boolean; samples: number[][] }
export interface Model { classes: { id: string; label: string; samples: number[][] }[]; threshold: number }
export interface TrainReport { model: Model | null; skipped: string[]; warnings: string[] }
export interface Prediction { label: string | null; best: string | null; confidence: number; distance: number }

export function resample(frames: number[][], n = FRAMES): number[] {
  const len = frames.length;
  if (!len) return [];
  const D = frames[0].length, out: number[] = [];
  for (let i = 0; i < n; i++) {
    const p = n === 1 ? 0 : (i * (len - 1)) / (n - 1);
    const a = Math.floor(p), b = Math.min(len - 1, a + 1), f = p - a;
    for (let d = 0; d < D; d++) out.push(frames[a][d] * (1 - f) + frames[b][d] * f);
  }
  return out;
}
export function dist(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; s += d * d; }
  return Math.sqrt(s / a.length);
}
export function train(signs: SignData[]): TrainReport {
  const ok = signs.filter((s) => s.samples.length >= MIN_SAMPLES);
  const skipped = signs.filter((s) => s.samples.length < MIN_SAMPLES).map((s) => s.label);
  if (!ok.length) return { model: null, skipped, warnings: [] };
  const loo: number[] = [];
  for (const s of ok) s.samples.forEach((a, i) => {
    let m = Infinity;
    s.samples.forEach((b, j) => { if (i !== j) m = Math.min(m, dist(a, b)); });
    loo.push(m);
  });
  loo.sort((x, y) => x - y);
  const p90 = loo[Math.min(loo.length - 1, Math.floor(loo.length * 0.9))];
  const threshold = Math.max(p90 * 1.3, 1e-6);
  const warnings: string[] = [];
  for (let i = 0; i < ok.length; i++) for (let j = i + 1; j < ok.length; j++) {
    let m = Infinity;
    for (const a of ok[i].samples) for (const b of ok[j].samples) m = Math.min(m, dist(a, b));
    if (m < threshold) warnings.push(`“${ok[i].label}” e “${ok[j].label}” são muito parecidos para o reconhecedor; grave mais exemplos.`);
  }
  return { model: { classes: ok.map(({ id, label, samples }) => ({ id, label, samples })), threshold }, skipped, warnings };
}
const clamp = (x: number) => Math.max(0, Math.min(1, x));
export function predict(model: Model, seq: number[], minConf = 0.5): Prediction {
  const per = model.classes
    .map((c) => ({ label: c.label, d: Math.min(...c.samples.map((s) => dist(s, seq))) }))
    .sort((a, b) => a.d - b.d);
  const d1 = per[0].d, d2 = per[1]?.d;
  const cAbs = clamp(1 - d1 / (2 * model.threshold));
  const cMar = d2 === undefined ? 1 : clamp(((d2 - d1) / Math.max(d2, 1e-9)) * 2);
  const confidence = Math.min(cAbs, cMar);
  const ok = d1 <= model.threshold && confidence >= minConf;
  return { label: ok ? per[0].label : null, best: per[0].label, confidence, distance: d1 };
}
