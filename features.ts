// Converte landmarks do MediaPipe (2 mãos + pose) em um vetor por quadro, normalizado pelo corpo.
export interface LM { x: number; y: number; z: number }
export interface HandIn { label: string; lm: LM[] }
export const DIM = 138; // 2 mãos × (21×3 + 2) + 4 pontos do corpo × 2
const d2 = (a: LM, b: LM) => Math.hypot(a.x - b.x, a.y - b.y);
export function frameFeatures(hands: HandIn[], pose: LM[] | null): number[] | null {
  if (!pose || pose.length < 17 || !hands.length) return null;
  const ls = pose[11], rs = pose[12], sw = d2(ls, rs);
  if (sw < 0.02) return null;
  const cx = (ls.x + rs.x) / 2, cy = (ls.y + rs.y) / 2, out: number[] = [];
  for (const side of ['Left', 'Right']) {
    const h = hands.find((x) => x.label === side);
    if (!h) { for (let i = 0; i < 65; i++) out.push(0); continue; }
    const w = h.lm[0], s = Math.max(d2(w, h.lm[9]), 1e-4);
    for (const p of h.lm) out.push((p.x - w.x) / s, (p.y - w.y) / s, (p.z - w.z) / s);
    out.push((2 * (w.x - cx)) / sw, (2 * (w.y - cy)) / sw); // posição da mão relativa ao tronco
  }
  for (const i of [13, 14, 15, 16]) out.push((pose[i].x - cx) / sw, (pose[i].y - cy) / sw);
  return out;
}
