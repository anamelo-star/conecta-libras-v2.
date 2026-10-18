import { FilesetResolver, HandLandmarker, PoseLandmarker } from '@mediapipe/tasks-vision';
export interface Trackers { hand: HandLandmarker; pose: PoseLandmarker }
// Primeiro tenta os arquivos locais (public/mediapipe, criados no build por scripts/setup-mediapipe.mjs);
// se faltarem, usa as URLs públicas oficiais do MediaPipe (exige internet).
const LOCAL = { wasm: './mediapipe/wasm', hand: './mediapipe/models/hand_landmarker.task', pose: './mediapipe/models/pose_landmarker_lite.task' };
const REMOTE = {
  wasm: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm',
  hand: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
  pose: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
};
async function make(src: typeof LOCAL, delegate: 'GPU' | 'CPU'): Promise<Trackers> {
  const fs = await FilesetResolver.forVisionTasks(src.wasm);
  const hand = await HandLandmarker.createFromOptions(fs, { baseOptions: { modelAssetPath: src.hand, delegate }, runningMode: 'VIDEO', numHands: 2 });
  try {
    const pose = await PoseLandmarker.createFromOptions(fs, { baseOptions: { modelAssetPath: src.pose, delegate }, runningMode: 'VIDEO', numPoses: 1 });
    return { hand, pose };
  } catch (error) {
    hand.close();
    throw error;
  }
}
export async function createTrackers(): Promise<Trackers> {
  for (const src of [LOCAL, REMOTE]) for (const d of ['GPU', 'CPU'] as const) {
    try { return await make(src, d); } catch { /* tenta a próxima combinação */ }
  }
  throw new Error('não foi possível carregar o MediaPipe (modelos locais e remotos falharam)');
}
