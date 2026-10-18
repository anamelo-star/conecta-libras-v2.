import { useEffect, useMemo, useRef, useState } from 'react';
import { db, norm } from '../lib/db.ts';
import type { VideoRec } from '../lib/db.ts';

// Português → Libras: toca vídeo cadastrado para o termo EXATO. Nunca monta frases juntando palavras.
export default function TranslatePanel({ query, quiet }: { query: string; quiet?: boolean }) {
  const [vids, setVids] = useState<VideoRec[]>([]);
  const [one, setOne] = useState<VideoRec | null>(null);
  const [rate, setRate] = useState(1);
  const vr = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    let ok = true; setOne(null);
    db.all<VideoRec>('videos').then((v) => { if (ok) setVids(v); }).catch(() => { /* sem IndexedDB */ });
    return () => { ok = false; };
  }, [query]);
  const q = norm(query);
  const hit = vids.find((v) => norm(v.term) === q) ?? null;
  const cur = q ? (hit ?? one) : null;
  const words = [...new Set(q.split(' ').filter(Boolean))].map((w) => vids.find((v) => norm(v.term) === w)).filter((v): v is VideoRec => !!v);
  const url = useMemo(() => (cur ? URL.createObjectURL(cur.blob) : ''), [cur]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  useEffect(() => { if (vr.current) vr.current.playbackRate = rate; }, [rate, url]);
  if (!q) return null;
  return (
    <>
      {!hit && !quiet && (
        <div className="card warn">
          <b>Sem tradução validada para “{query}”.</b> Não há vídeo cadastrado para este termo exato.
          {words.length > 0 && query.trim().includes(' ') && <><p>Sinais isolados cadastrados (não formam a frase em Libras):</p>{words.map((w) => <button key={w.key} className="btn c" onClick={() => setOne(w)}>{w.term}</button>)}</>}
        </div>
      )}
      {cur && (
        <div className="card">
          <b>{cur.term}</b> <span className="tag">{cur.valid ? 'validado por especialista' : 'não validado'}</span> <span className="tag">fonte: {cur.src || 'não informada'}</span>
          <video key={url} ref={vr} className="pl" src={url} controls playsInline onLoadedMetadata={() => { if (vr.current) vr.current.playbackRate = rate; }} />
          <div className="row">
            <button className="btn c" onClick={() => { if (vr.current) { vr.current.currentTime = 0; void vr.current.play(); } }}>↻ Repetir</button>
            <label>Velocidade <select value={rate} onChange={(e) => setRate(+e.target.value)}><option value={0.5}>0,5x</option><option value={0.75}>0,75x</option><option value={1}>1x</option></select></label>
          </div>
        </div>
      )}
    </>
  );
}
