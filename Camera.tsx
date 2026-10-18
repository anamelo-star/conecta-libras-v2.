import { useEffect, useRef, useState } from 'react';
import { createTrackers } from '../lib/mp.ts';
import type { Trackers } from '../lib/mp.ts';
import { frameFeatures } from '../lib/features.ts';
import type { LM } from '../lib/features.ts';
import { MIN_SAMPLES, predict, resample, train } from '../lib/recognizer.ts';
import type { Model, Prediction, SignData, TrainReport } from '../lib/recognizer.ts';
import { db } from '../lib/db.ts';

const PRESETS = ['Olá', 'Bom dia', 'Obrigado', 'Sim', 'Não', 'Ajuda', 'Água', 'Dor', 'Médico', 'Hospital', 'Banheiro', 'Remédio', 'Comer', 'Beber', 'Esperar', 'Febre'];
const WIN = 2000; // janela de 2 s: tanto na gravação quanto no reconhecimento
type Mode = 'rec' | 'train';

export default function Camera() {
  const vref = useRef<HTMLVideoElement>(null);
  const cref = useRef<HTMLCanvasElement>(null);
  const trk = useRef<Trackers | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const raf = useRef(0);
  const countdown = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastT = useRef(-1);
  const seenRef = useRef(false);
  const buf = useRef<{ t: number; f: number[] }[]>([]);
  const rec = useRef<{ until: number; frames: number[][] } | null>(null);
  const stab = useRef({ label: '', n: 0, last: '', lastT: 0, evalT: 0 });
  const [on, setOn] = useState(false);
  const [status, setStatus] = useState('Câmera desligada');
  const [seen, setSeen] = useState(false);
  const [mode, setMode] = useState<Mode>('train');
  const [signs, setSigns] = useState<SignData[]>([]);
  const [sel, setSel] = useState('');
  const [name, setName] = useState('');
  const [model, setModel] = useState<Model | null>(null);
  const [report, setReport] = useState<TrainReport | null>(null);
  const [minConf, setMinConf] = useState(0.5);
  const [pred, setPred] = useState<Prediction | null>(null);
  const [text, setText] = useState<string[]>([]);
  const [msg, setMsg] = useState('');
  const [count, setCount] = useState(0);
  const S = useRef({ mode, model, minConf, signs, sel });
  S.current = { mode, model, minConf, signs, sel };

  useEffect(() => {
    void (async () => {
      setSigns(await db.all<SignData>('signs'));
      const m = (await db.all<{ key: string; model: Model | null }>('meta')).find((x) => x.key === 'model');
      if (m?.model) { setModel(m.model); setMode('rec'); }
    })();
    return () => stop();
  }, []);

  const finish = (frames: number[][]) => {
    rec.current = null;
    const s = S.current.signs.find((x) => x.id === S.current.sel);
    if (!s) return;
    if (frames.length < 15) { setMsg('Poucos quadros com ombros e mãos visíveis. Afaste-se um pouco e tente de novo.'); return; }
    const upd = { ...s, samples: [...s.samples, resample(frames)] };
    const next = S.current.signs.map((x) => (x.id === s.id ? upd : x));
    setSigns(next); S.current.signs = next; void db.put('signs', upd);
    setMsg(`Exemplo ${upd.samples.length} salvo para “${s.label}”.`);
  };
  const evaluate = (now: number) => {
    const { model: m, minConf: mc } = S.current, st = stab.current;
    if (!m || buf.current.length < 15 || now - st.evalT < 200) return;
    st.evalT = now;
    const p = predict(m, resample(buf.current.map((x) => x.f)), mc);
    setPred(p);
    if (p.label) {
      st.n = p.label === st.label ? st.n + 1 : 1; st.label = p.label;
      if (st.n >= 3 && !(p.label === st.last && now - st.lastT < 2500)) {
        st.last = p.label; st.lastT = now; st.n = 0; buf.current = [];
        const l = p.label; setText((t) => [...t, l]);
      }
    } else { st.n = 0; st.label = ''; }
  };
  const draw = (hands: LM[][], pose: LM[] | null) => {
    const c = cref.current, v = vref.current;
    if (!c || !v) return;
    if (c.width !== v.videoWidth) { c.width = v.videoWidth; c.height = v.videoHeight; }
    const g = c.getContext('2d')!; g.clearRect(0, 0, c.width, c.height);
    g.fillStyle = '#19b5a5';
    for (const lm of hands) for (const p of lm) { g.beginPath(); g.arc(p.x * c.width, p.y * c.height, 4, 0, 7); g.fill(); }
    g.fillStyle = '#ffb703';
    if (pose) for (const i of [11, 12, 13, 14, 15, 16]) { g.beginPath(); g.arc(pose[i].x * c.width, pose[i].y * c.height, 6, 0, 7); g.fill(); }
  };
  const loop = () => {
    const v = vref.current, t = trk.current;
    if (!v || !t) return;
    if (v.readyState >= 2 && v.currentTime !== lastT.current) {
      lastT.current = v.currentTime;
      const now = performance.now();
      const h = t.hand.detectForVideo(v, now), p = t.pose.detectForVideo(v, now);
      const hands = h.landmarks.map((lm, i) => ({ label: h.handedness[i]?.[0]?.categoryName ?? 'Right', lm }));
      const pose = p.landmarks[0] ?? null;
      draw(hands.map((x) => x.lm), pose);
      const f = frameFeatures(hands, pose);
      if (seenRef.current !== !!f) { seenRef.current = !!f; setSeen(!!f); }
      if (f) buf.current.push({ t: now, f });
      while (buf.current.length && now - buf.current[0].t > WIN) buf.current.shift();
      if (rec.current) { if (f) rec.current.frames.push(f); if (now >= rec.current.until) finish(rec.current.frames); }
      else if (S.current.mode === 'rec') evaluate(now);
    }
    raf.current = requestAnimationFrame(loop);
  };
  const start = async () => {
    try {
      setStatus('Pedindo permissão da câmera…'); lastT.current = -1;
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 }, audio: false });
      stream.current = s;
      const v = vref.current!; v.srcObject = s; await v.play();
      setStatus('Carregando MediaPipe…');
      trk.current = await createTrackers();
      setOn(true); setStatus('Câmera ligada'); loop();
    } catch (e) {
      setStatus('Erro: ' + (e as Error).message + ' (a câmera exige https ou localhost; rode “npm run setup:mediapipe” se faltarem os modelos)');
      stream.current?.getTracks().forEach((x) => x.stop());
      stream.current = null;
      if (vref.current) vref.current.srcObject = null;
    }
  };
  function stop() {
    cancelAnimationFrame(raf.current);
    if (countdown.current) clearInterval(countdown.current);
    countdown.current = null;
    rec.current = null;
    setCount(0);
    stream.current?.getTracks().forEach((x) => x.stop());
    stream.current = null;
    if (vref.current) vref.current.srcObject = null;
    trk.current?.hand.close(); trk.current?.pose.close(); trk.current = null;
    setOn(false); setStatus('Câmera desligada');
  }
  const record = () => {
    if (!on || !sel) { setMsg('Ligue a câmera e escolha um sinal.'); return; }
    let n = 3; setCount(n); setMsg('');
    if (countdown.current) clearInterval(countdown.current);
    countdown.current = setInterval(() => {
      n--;
      if (n > 0) setCount(n);
      else { if (countdown.current) clearInterval(countdown.current); countdown.current = null; setCount(0); buf.current = []; rec.current = { until: performance.now() + WIN, frames: [] }; setMsg('Gravando… faça o sinal agora (2 s).'); }
    }, 1000);
  };
  const add = (label: string) => {
    label = label.trim(); if (!label) return;
    const ex = signs.find((s) => s.label.toLowerCase() === label.toLowerCase());
    if (ex) { setSel(ex.id); return; }
    const s: SignData = { id: crypto.randomUUID(), label, validated: false, samples: [] };
    setSigns([...signs, s]); setSel(s.id); setName(''); void db.put('signs', s);
  };
  const delSample = (s: SignData) => {
    const u = { ...s, samples: s.samples.slice(0, -1) };
    setSigns(signs.map((x) => (x.id === s.id ? u : x))); void db.put('signs', u);
  };
  const delSign = (s: SignData) => { setSigns(signs.filter((x) => x.id !== s.id)); if (sel === s.id) setSel(''); void db.del('signs', s.id); };
  const doTrain = () => {
    const r = train(signs); setReport(r); setModel(r.model);
    void db.put('meta', { key: 'model', model: r.model, at: Date.now() });
    if (r.model) setMode('rec');
  };
  const copy = () => navigator.clipboard?.writeText(text.join(' '));
  const say = () => { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text.join(' ')); u.lang = 'pt-BR'; speechSynthesis.speak(u); };

  return (
    <>
      <div className="card warn">
        <b>Limitações:</b> este recurso reconhece apenas <b>sinais isolados que você cadastrou</b>, um por vez. Ele <b>não traduz Libras</b> nem frases. Sinais cadastrados aqui <b>não são validados por especialistas</b>. A precisão depende de quem cadastra, da luz e do enquadramento, e ainda não foi medida.
      </div>
      <div className="cam">
        <video ref={vref} playsInline muted /><canvas ref={cref} />
        {count > 0 && <div className="cnt" aria-live="assertive">{count}</div>}
      </div>
      <div className="row">
        {!on ? <button className="btn c p" onClick={start}>📷 Ligar câmera</button> : <button className="btn c" onClick={stop}>Desligar</button>}
        <span role="status">{status}{on && (seen ? ' · ombros e mãos detectados' : ' · mostre ombros e mãos')}</span>
      </div>
      <p className="tag">O vídeo não é gravado nem enviado. Só números dos pontos do corpo são salvos neste aparelho.</p>
      <div className="row">
        <button className={'btn c' + (mode === 'rec' ? ' on' : '')} onClick={() => setMode('rec')}>Reconhecer</button>
        <button className={'btn c' + (mode === 'train' ? ' on' : '')} onClick={() => setMode('train')}>Cadastrar sinais</button>
      </div>

      {mode === 'rec' ? (
        <div className="card">
          {!model && <p>Nenhum modelo treinado. Cadastre ao menos {MIN_SAMPLES} exemplos de um sinal e toque em “Treinar”.</p>}
          <div className="res" aria-live="polite">{pred ? (pred.label ?? 'Sinal não reconhecido') : '—'}</div>
          <div className="bar" aria-hidden><i style={{ width: `${Math.round((pred?.confidence ?? 0) * 100)}%` }} /></div>
          <p>Confiança: {Math.round((pred?.confidence ?? 0) * 100)}%{pred && !pred.label && pred.best ? ` (mais parecido: ${pred.best}, mas abaixo do mínimo)` : ''}</p>
          <label>Confiança mínima: {Math.round(minConf * 100)}%<input type="range" min="0.3" max="0.9" step="0.05" value={minConf} onChange={(e) => setMinConf(+e.target.value)} style={{ width: '100%' }} /></label>
          <h2>Texto reconhecido</h2>
          <div className="res" style={{ textAlign: 'left' }}>{text.join(' ') || '…'}</div>
          <div className="row">
            <button className="btn c" onClick={copy}>Copiar</button>
            <button className="btn c" onClick={say}>🔊 Ouvir</button>
            <button className="btn c" onClick={() => setText([])}>Limpar</button>
          </div>
          <p className="tag">Faça o sinal inteiro dentro de cerca de 2 segundos. A palavra só entra no texto após 3 leituras consistentes.</p>
        </div>
      ) : (
        <div className="card">
          <h2>1. Escolha ou crie um sinal</h2>
          <div className="row">{PRESETS.map((p) => <button key={p} className="btn c" onClick={() => add(p)}>{p}</button>)}</div>
          <div className="row"><input type="text" aria-label="Novo sinal" placeholder="Outro sinal…" value={name} onChange={(e) => setName(e.target.value)} style={{ flex: 1 }} /><button className="btn c p" onClick={() => add(name)}>Adicionar</button></div>
          <h2>2. Grave exemplos (mín. {MIN_SAMPLES}; ideal 8 ou mais, variando posição e velocidade)</h2>
          {signs.map((s) => (
            <div key={s.id} className={'btn' + (sel === s.id ? ' on' : '')} role="button" tabIndex={0} onClick={() => setSel(s.id)} onKeyDown={(e) => e.key === 'Enter' && setSel(s.id)}>
              <span style={{ flex: 1 }}><b>{s.label}</b> <span className="tag">{s.samples.length} exemplos · não validado por especialista</span></span>
              <button className="btn c" aria-label={`Apagar último exemplo de ${s.label}`} onClick={(e) => { e.stopPropagation(); delSample(s); }}>↶</button>
              <button className="btn c" aria-label={`Apagar sinal ${s.label}`} onClick={(e) => { e.stopPropagation(); delSign(s); }}>✕</button>
            </div>
          ))}
          <button className="btn p" onClick={record} disabled={!on || !sel || count > 0 || !!rec.current}>⏺ Gravar exemplo (contagem de 3 s)</button>
          <p role="status">{msg}</p>
          <h2>3. Treine e teste</h2>
          <button className="btn p" onClick={doTrain}>Treinar / atualizar reconhecedor</button>
          {report && (
            <div>
              {report.model ? <p>Modelo com {report.model.classes.length} sinais. Limiar de distância: {report.model.threshold.toFixed(3)}.</p> : <p>Nenhum sinal tem exemplos suficientes.</p>}
              {report.skipped.length > 0 && <p>Faltam exemplos para: {report.skipped.join(', ')}.</p>}
              {report.warnings.map((w) => <p key={w}>⚠️ {w}</p>)}
            </div>
          )}
          <p className="tag">Método: vizinho mais próximo sobre sequências de pontos das mãos e dos ombros/cotovelos/punhos (MediaPipe). Expressões faciais ainda não são usadas.</p>
        </div>
      )}
    </>
  );
}
