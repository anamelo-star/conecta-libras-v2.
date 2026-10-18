import { useState } from 'react';
import { speak } from '../lib/speech.ts';
import { useLocal } from '../lib/useLocal.ts';
import TranslatePanel from '../components/TranslatePanel.tsx';

const DEF = ['Bom dia', 'Como posso ajudar?', 'Você está sentindo dor?', 'Precisa de água?', 'Aguarde um momento'];
export default function Favorites() {
  const [fav, setFav] = useLocal<string[]>('fav', DEF);
  const [nf, setNf] = useState(''), [q, setQ] = useState('');
  return (
    <>
      <p className="card">Salve apenas frases comuns. Não digite dados de pacientes aqui: esta lista fica salva no aparelho.</p>
      <div className="row"><input type="text" aria-label="Nova frase" placeholder="Nova frase" value={nf} onChange={(e) => setNf(e.target.value)} style={{ flex: 1 }} />
        <button className="btn c p" onClick={() => { if (nf.trim()) { setFav([...fav, nf.trim()]); setNf(''); } }}>Adicionar</button></div>
      {fav.map((f, i) => (
        <div key={f + i} className="card row"><span style={{ flex: 1 }}>{f}</span>
          <button className="btn c" aria-label={`Ouvir ${f}`} onClick={() => speak(f)}>🔊</button>
          <button className="btn c" onClick={() => setQ(f)}>Libras</button>
          <button className="btn c" aria-label={`Remover ${f}`} onClick={() => setFav(fav.filter((_, j) => j !== i))}>✕</button></div>
      ))}
      {!fav.length && <p>Nenhum favorito.</p>}
      <TranslatePanel query={q} />
    </>
  );
}
