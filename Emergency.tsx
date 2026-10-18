import { useState } from 'react';
import { speak } from '../lib/speech.ts';
import TranslatePanel from '../components/TranslatePanel.tsx';

export const EM = ['PRECISO DE AJUDA', 'ESTOU COM MUITA DOR', 'NÃO CONSIGO RESPIRAR', 'ESTOU COM TONTURA', 'TENHO ALERGIA', 'PRECISO DE UM MÉDICO', 'NÃO ESTOU ME SENTINDO BEM', 'NÃO ENTENDI', 'POR FAVOR, REPITA', 'PRECISO DE UM INTÉRPRETE DE LIBRAS'];
export default function Emergency() {
  const [i, setI] = useState<number | null>(null);
  const open = (n: number) => { setI(n); speak(EM[n]); };
  return (
    <>
      <div className="card warn">Este app não substitui os serviços oficiais de emergência (no Brasil, SAMU 192). As frases funcionam sem inteligência artificial e sem internet depois de carregado.</div>
      {EM.map((t, n) => <button key={t} className="btn e" onClick={() => open(n)}>{t}</button>)}
      {i !== null && (
        <div className="big" role="dialog" aria-modal="true" aria-label="Mensagem de emergência">
          <p>{EM[i]}</p>
          <div className="row">
            <button className="btn c" onClick={() => speak(EM[i])}>🔊 Ouvir / repetir</button>
            <button className="btn c" autoFocus onClick={() => { speechSynthesis.cancel(); setI(null); }}>Fechar</button>
          </div>
          <div style={{ width: 'min(100%,420px)' }}><TranslatePanel query={EM[i]} quiet /></div>
          <small>Libras só aparece se houver vídeo cadastrado para esta frase (Português → Libras).</small>
        </div>
      )}
    </>
  );
}
