// Copia o WASM do MediaPipe e baixa os modelos para public/mediapipe (uso offline depois).
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
const out = 'public/mediapipe';
mkdirSync(out + '/models', { recursive: true });
try { cpSync('node_modules/@mediapipe/tasks-vision/wasm', out + '/wasm', { recursive: true }); console.log('WASM copiado.'); }
catch (e) { console.warn('Não foi possível copiar o WASM:', e.message); }
const models = {
  'hand_landmarker.task': 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
  'pose_landmarker_lite.task': 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
};
for (const [name, url] of Object.entries(models)) {
  const p = `${out}/models/${name}`;
  if (existsSync(p)) continue;
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    writeFileSync(p, Buffer.from(await r.arrayBuffer()));
    console.log('Baixado:', name);
  } catch (e) {
    console.warn(`Falha ao baixar ${name} (${e.message}). Baixe manualmente de ${url} para ${p}`);
  }
}
