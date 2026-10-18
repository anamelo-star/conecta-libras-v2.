import { useEffect, useState } from 'react';
import { db, norm } from '../lib/db.ts';
import type { VideoRec } from '../lib/db.ts';
import { avatarRenderer } from '../lib/signRenderer.ts';
import TranslatePanel from '../components/TranslatePanel.tsx';

export const CATS = ['Cumprimentos', 'Saúde', 'Sintomas', 'Alimentação', 'Família', 'Necessidades básicas', 'Comunicação cotidiana'];
export default function Videos() {
  const [vids, setVids] = useState<VideoRec[]>([]);
  const [text, setText] = useState(''), [query, setQuery] = useState(''), [find, setFind] = useState('');
  const [term, setTerm] = useState(''), [cat, setCat] = useState(CATS[0]), [src, setSrc] = useState(''), [valid, setValid] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState('');
  const load = async () => { try { setVids(await db.all<VideoRec>('videos')); } catch { setMsg('Armazenamento local indisponível neste navegador (modo privado?).'); } };
  useEffect(() => { void load(); }, []);
  const save = async () => {
    if (!term.trim() || !file) { setMsg('Informe o termo e escolha um vídeo.'); return; }
    try {
      await db.put('videos', { key: norm(term), term: term.trim(), cat, src: src.trim(), valid, blob: file } satisfies VideoRec);
      setMsg(`“${term.trim()}” salvo neste aparelho.`); setTerm(''); setFile(null); await load();
    } catch { setMsg('Não foi possível salvar o vídeo (espaço ou permissão).'); }
  };
  const shown = vids.filter((v) => !find || norm(v.term).includes(norm(find)));
  return (
    <>
      <div className="card warn">Use apenas vídeos próprios, autorizados ou com licença compatível. O app só toca o vídeo cadastrado para o <b>termo exato</b>; não monta frases em Libras juntando palavras.</div>
      <h2>Português → Libras</h2>
      <input type="text" aria-label="Palavra ou frase" placeholder="Ex.: Bom dia" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && setQuery(text)} />
      <div className="row"><button className="btn c p" onClick={() => setQuery(text)}>Traduzir</button><button className="btn c" onClick={() => { setText(''); setQuery(''); }}>Limpar</button></div>
      <TranslatePanel query={query} />
      <div className="card"><b>{avatarRenderer.name}</b><p>{avatarRenderer.reason}</p></div>
      <h2>Vídeos cadastrados ({vids.length})</h2>
      <input type="text" aria-label="Pesquisar vídeos" placeholder="Pesquisar cadastrados…" value={find} onChange={(e) => setFind(e.target.value)} />
      {shown.map((v) => (
        <div key={v.key} className="card row"><span style={{ flex: 1 }}><b>{v.term}</b> <span className="tag">{v.cat}</span> <span className="tag">{v.valid ? 'validado' : 'não validado'}</span></span>
          <button className="btn c" onClick={() => { setText(v.term); setQuery(v.term); }}>▶</button>
          <button className="btn c" aria-label={`Remover ${v.term}`} onClick={async () => { await db.del('videos', v.key); await load(); }}>✕</button></div>
      ))}
      <div className="card">
        <h2>Cadastrar vídeo (salvo neste aparelho)</h2>
        <input type="text" aria-label="Termo" placeholder="Palavra ou expressão" value={term} onChange={(e) => setTerm(e.target.value)} />
        <select aria-label="Categoria" value={cat} onChange={(e) => setCat(e.target.value)}>{CATS.map((c) => <option key={c}>{c}</option>)}</select>
        <input type="text" aria-label="Fonte e licença" placeholder="Fonte / autoria e licença" value={src} onChange={(e) => setSrc(e.target.value)} />
        <label><input type="checkbox" checked={valid} onChange={(e) => setValid(e.target.checked)} /> Validado por especialista em Libras</label>
        <input type="file" accept="video/*" aria-label="Arquivo de vídeo" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <button className="btn p" onClick={save}>Cadastrar</button>
        <p role="status">{msg}</p>
      </div>
    </>
  );
}
