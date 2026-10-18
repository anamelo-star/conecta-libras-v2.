import { useEffect, useRef, useState } from 'react';
import TranslatePanel from '../components/TranslatePanel.tsx';

export default function Voice() {
  const [text, setText] = useState(''), [query, setQuery] = useState(''), [on, setOn] = useState(false), [err, setErr] = useState('');
  const rec = useRef<{ stop(): void } | null>(null);
  const w = window as unknown as Record<string, unknown>;
  const SR = (w.SpeechRecognition || w.webkitSpeechRecognition) as (new () => any) | undefined; // eslint-disable-line @typescript-eslint/no-explicit-any
  const stop = () => { try { rec.current?.stop(); } catch { /* já parado */ } rec.current = null; setOn(false); };
  useEffect(() => () => { try { rec.current?.stop(); } catch { /* ok */ } }, []);
  const start = () => {
    if (!SR) { setErr('Seu navegador não oferece reconhecimento de fala (use Chrome ou Edge). Você ainda pode digitar abaixo.'); return; }
    stop();
    const r = new SR();
    r.lang = 'pt-BR'; r.interimResults = true; r.continuous = true;
    r.onresult = (e: any) => { let s = ''; for (let i = 0; i < e.results.length; i++) s += e.results[i][0].transcript; setText(s); }; // eslint-disable-line @typescript-eslint/no-explicit-any
    r.onerror = (e: any) => { setErr(e.error === 'not-allowed' ? 'Permissão do microfone negada.' : 'Erro no reconhecimento: ' + e.error); setOn(false); }; // eslint-disable-line @typescript-eslint/no-explicit-any
    r.onend = () => setOn(false);
    rec.current = r; r.start(); setOn(true); setErr('');
  };
  return (
    <>
      {!SR && <div className="card warn">Reconhecimento de fala indisponível neste navegador (Web Speech API). Funciona no Chrome e no Edge; Firefox não oferece.</div>}
      <p className="card">A fala é convertida pelo serviço de voz do navegador (no Chrome, por servidores do Google). O Conecta Libras não grava nem guarda o áudio.</p>
      <div className="row">
        <button className="btn c p" onClick={on ? stop : start} aria-pressed={on}>{on ? '⏹ Parar' : '🎤 Iniciar gravação'}</button>
        <span role="status">{on ? 'Ouvindo…' : ''}</span>
      </div>
      <label htmlFor="vt"><b>Texto (você pode corrigir)</b></label>
      <textarea id="vt" value={text} onChange={(e) => setText(e.target.value)} />
      <div className="row">
        <button className="btn c p" onClick={() => setQuery(text)}>Traduzir</button>
        <button className="btn c" onClick={() => setQuery(text)}>↻ Repetir sinalização</button>
        <button className="btn c" onClick={() => { stop(); setText(''); setQuery(''); }}>Limpar</button>
      </div>
      <p role="alert">{err}</p>
      <TranslatePanel query={query} />
    </>
  );
}
