import { useState } from 'react';
import { speak } from '../lib/speech.ts';

type R = [string, number, number, number, number, number];
const FRONT: R[] = [['Cabeça', 80, 6, 40, 48, 20], ['Pescoço', 92, 56, 16, 12, 4], ['Peito', 70, 70, 60, 48, 10], ['Abdômen', 74, 120, 52, 48, 10], ['Braço esquerdo', 46, 70, 22, 68, 10], ['Braço direito', 132, 70, 22, 68, 10], ['Mão esquerda', 44, 142, 24, 28, 10], ['Mão direita', 132, 142, 24, 28, 10], ['Perna esquerda', 76, 172, 23, 106, 10], ['Perna direita', 101, 172, 23, 106, 10], ['Pé esquerdo', 72, 280, 27, 16, 8], ['Pé direito', 101, 280, 27, 16, 8]];
const rn = (r: R, n: string): R => [n, r[1], r[2], r[3], r[4], r[5]];
const BACK: R[] = FRONT.map((r) => (r[0] === 'Peito' ? rn(r, 'Costas (parte alta)') : r[0] === 'Abdômen' ? rn(r, 'Costas (parte baixa)') : r[0] === 'Cabeça' ? rn(r, 'Cabeça (atrás)') : r));
const Q: { k: string; q: string; opts?: string[]; text?: boolean }[] = [
  { k: 'dor', q: 'Você está sentindo dor?' }, { k: 'inicio', q: 'Quando a dor começou?', opts: ['Hoje', 'Ontem', 'Há alguns dias', 'Mais de uma semana'] },
  { k: 'febre', q: 'Está com febre?' }, { k: 'tontura', q: 'Está com tontura?' }, { k: 'nausea', q: 'Está com náuseas?' },
  { k: 'resp', q: 'Está com dificuldade para respirar?' }, { k: 'alergia', q: 'Possui alguma alergia?', text: true },
  { k: 'med', q: 'Utiliza algum medicamento?', text: true }, { k: 'antes', q: 'Já sentiu isso anteriormente?' }, { k: 'ajuda', q: 'Precisa de ajuda?' },
];
const LV = (n: number) => (n === 0 ? 'Sem dor' : n <= 3 ? 'Dor leve' : n <= 6 ? 'Dor moderada' : n <= 9 ? 'Dor intensa' : 'Pior dor imaginável');
const LC = ['#2e9e4f', '#2e9e4f', '#6bb43a', '#9cbb2f', '#a88e00', '#b87400', '#c25f00', '#c24a00', '#c23500', '#b3261e', '#7a0b0b'];

export default function Medical() {
  const [view, setView] = useState<'f' | 'b'>('f');
  const [reg, setReg] = useState<string[]>([]);
  const [pain, setPain] = useState<number | null>(null);
  const [ans, setAns] = useState<Record<string, string>>({});
  const [txt, setTxt] = useState<Record<string, string>>({});
  const [obs, setObs] = useState('');
  const [done, setDone] = useState(false);
  const toggle = (n: string) => setReg((r) => (r.includes(n) ? r.filter((x) => x !== n) : [...r, n]));
  const summary = () => {
    const L = ['RESUMO DO ATENDIMENTO', 'Local da dor: ' + (reg.join(', ') || 'não informado'), 'Intensidade: ' + (pain === null ? 'não informada' : `${pain}/10 (${LV(pain)})`)];
    for (const q of Q) if (ans[q.k] || txt[q.k]) L.push(`${q.q} ${ans[q.k] ?? ''}${txt[q.k] ? ' — ' + txt[q.k] : ''}`);
    L.push('Observações: ' + (obs || 'nenhuma'), '(Informado pelo paciente; sem diagnóstico.)');
    return L.join('\n');
  };
  const wipe = () => { setReg([]); setPain(null); setAns({}); setTxt({}); setObs(''); setDone(false); };
  if (done) return (
    <>
      <div className="card"><pre style={{ whiteSpace: 'pre-wrap', font: 'inherit', margin: 0 }}>{summary()}</pre></div>
      <div className="row">
        <button className="btn c" onClick={() => navigator.clipboard?.writeText(summary())}>Copiar</button>
        <button className="btn c" onClick={() => setDone(false)}>Editar</button>
        <button className="btn c e" onClick={wipe}>Limpar dados</button>
      </div>
      <p className="tag">O resumo existe só nesta aba, em memória. Recarregar ou fechar a página também o apaga.</p>
    </>
  );
  const R = view === 'f' ? FRONT : BACK;
  return (
    <>
      <div className="card warn">Este recurso apenas organiza informações para o profissional. Não faz diagnóstico, prescrição ou recomendação de tratamento. Nada é salvo automaticamente.</div>
      <h2>1. Onde dói?</h2>
      <div className="row" style={{ justifyContent: 'center' }}>
        <button className={'btn c' + (view === 'f' ? ' on' : '')} onClick={() => setView('f')}>Frente</button>
        <button className={'btn c' + (view === 'b' ? ' on' : '')} onClick={() => setView('b')}>Costas</button>
      </div>
      <svg viewBox="0 0 200 300" style={{ maxWidth: 260, display: 'block', margin: 'auto' }} role="group" aria-label="Mapa corporal">
        {R.map((r) => (
          <rect key={r[0]} className={'reg' + (reg.includes(r[0]) ? ' on' : '')} x={r[1]} y={r[2]} width={r[3]} height={r[4]} rx={r[5]} tabIndex={0} role="button" aria-pressed={reg.includes(r[0])} aria-label={r[0]}
            onClick={() => toggle(r[0])} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(r[0]); } }}><title>{r[0]}</title></rect>
        ))}
      </svg>
      <p>Selecionadas: <b>{reg.join(', ') || 'nenhuma'}</b></p>
      <h2>2. De 0 a 10, qual é a intensidade da sua dor?</h2>
      <div className="pain row" style={{ justifyContent: 'center' }}>
        {LC.map((c, n) => <button key={n} style={{ background: c }} className={pain === n ? 'on' : ''} aria-pressed={pain === n} aria-label={`${n}, ${LV(n)}`} onClick={() => setPain(n)}>{n}</button>)}
      </div>
      <p style={{ textAlign: 'center', fontWeight: 700 }}>{pain === null ? 'Toque em um número' : `${pain} — ${LV(pain)}`}</p>
      <p style={{ textAlign: 'center' }} className="tag">0 sem dor · 1–3 leve · 4–6 moderada · 7–9 intensa · 10 pior dor imaginável</p>
      <h2>3. Perguntas</h2>
      {Q.map((q) => (
        <div key={q.k} className="card"><b>{q.q}</b> <button className="btn c" aria-label="Ouvir pergunta" onClick={() => speak(q.q)}>🔊</button>
          <div className="row">{(q.opts ?? ['Sim', 'Não', 'Não sei']).map((o) => <button key={o} className={'btn c' + (ans[q.k] === o ? ' on' : '')} aria-pressed={ans[q.k] === o} onClick={() => setAns({ ...ans, [q.k]: o })}>{o}</button>)}</div>
          {q.text && <input type="text" aria-label={`Detalhes: ${q.q}`} placeholder="Detalhes (opcional)" value={txt[q.k] ?? ''} onChange={(e) => setTxt({ ...txt, [q.k]: e.target.value })} />}
        </div>
      ))}
      <label htmlFor="ob"><b>Observações</b></label>
      <textarea id="ob" value={obs} onChange={(e) => setObs(e.target.value)} />
      <button className="btn p" onClick={() => setDone(true)}>Finalizar e ver resumo</button>
    </>
  );
}
