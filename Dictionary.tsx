import { useEffect, useState } from 'react';
import { db, norm } from '../lib/db.ts';
import type { VideoRec } from '../lib/db.ts';
import { CATS } from './Videos.tsx';
import TranslatePanel from '../components/TranslatePanel.tsx';

const TERMS: Record<string, string[]> = { Cumprimentos: ['Olá', 'Bom dia', 'Boa tarde', 'Obrigado'], Saúde: ['Médico', 'Hospital', 'Remédio', 'Ajuda'], Sintomas: ['Dor', 'Febre', 'Tontura', 'Náusea'], Alimentação: ['Água', 'Comer', 'Beber'], Família: ['Mãe', 'Pai', 'Filho'], 'Necessidades básicas': ['Banheiro', 'Esperar'], 'Comunicação cotidiana': ['Sim', 'Não', 'Por favor'] };
export default function Dictionary() {
  const [vids, setVids] = useState<VideoRec[]>([]);
  const [q, setQ] = useState(''), [sel, setSel] = useState('');
  useEffect(() => { db.all<VideoRec>('videos').then(setVids).catch(() => { /* sem IndexedDB */ }); }, []);
  return (
    <>
      <p className="card">As palavras abaixo são uma lista de termos; <b>o vídeo só existe depois que você (ou sua equipe) o cadastra</b> em Português → Libras, com fonte e licença. Termos com ▶ já têm vídeo.</p>
      <input type="text" aria-label="Pesquisar" placeholder="Pesquisar…" value={q} onChange={(e) => setQ(e.target.value)} />
      {CATS.map((c) => {
        const t = [...new Set([...(TERMS[c] ?? []), ...vids.filter((v) => v.cat === c).map((v) => v.term)])].filter((x) => !q || norm(x).includes(norm(q)));
        return t.length ? <div key={c}><h2>{c}</h2><div className="row">{t.map((x) => <button key={x} className={'btn c' + (vids.some((v) => norm(v.term) === norm(x)) ? ' p' : '')} onClick={() => setSel(x)}>{x}{vids.some((v) => norm(v.term) === norm(x)) ? ' ▶' : ''}</button>)}</div></div> : null;
      })}
      <TranslatePanel query={sel} />
      <p className="tag">Variações regionais: não há dados de variação regional incluídos; registre-as no campo “fonte” ao cadastrar.</p>
    </>
  );
}
