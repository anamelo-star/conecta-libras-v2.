import { useEffect, useState } from 'react';
import Camera from './pages/Camera.tsx';
import Videos from './pages/Videos.tsx';
import Voice from './pages/Voice.tsx';
import Medical from './pages/Medical.tsx';
import Emergency from './pages/Emergency.tsx';
import Dictionary from './pages/Dictionary.tsx';
import Favorites from './pages/Favorites.tsx';
import Settings from './pages/Settings.tsx';
import type { Cfg } from './pages/Settings.tsx';
import About from './pages/About.tsx';
import { useLocal } from './lib/useLocal.ts';

const TITLES: Record<string, string> = { libras: 'Libras → Português', p2l: 'Português → Libras', v2l: 'Voz → Libras', med: 'Atendimento médico', em: 'Emergência', dic: 'Dicionário', fav: 'Favoritos', cfg: 'Acessibilidade', sobre: 'Sobre' };
export default function App() {
  const [r, setR] = useState(location.hash.slice(1) || 'home');
  const [cfg, setCfg] = useLocal<Cfg>('cfg', { fs: 100, hc: false, anim: 1 });
  useEffect(() => { const f = () => { setR(location.hash.slice(1) || 'home'); window.scrollTo(0, 0); }; addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, []);
  useEffect(() => {
    const el = document.documentElement;
    el.style.fontSize = cfg.fs + '%'; el.dataset.hc = cfg.hc ? '1' : '0'; el.style.setProperty('--a', String(cfg.anim));
  }, [cfg]);
  useEffect(() => { document.title = (TITLES[r] ? TITLES[r] + ' · ' : '') + 'Conecta Libras'; }, [r]);
  const page = r === 'libras' ? <Camera /> : r === 'p2l' ? <Videos /> : r === 'v2l' ? <Voice /> : r === 'med' ? <Medical /> : r === 'em' ? <Emergency /> : r === 'dic' ? <Dictionary /> : r === 'fav' ? <Favorites /> : r === 'cfg' ? <Settings cfg={cfg} setCfg={setCfg} /> : r === 'sobre' ? <About /> : null;
  return (
    <>
      <header>
        {page && <a className="btn c" href="#home" aria-label="Voltar ao início" style={{ margin: 0, minHeight: '2.4rem' }}>←</a>}
        <h1>{page ? TITLES[r] : 'Conecta Libras'}</h1>
      </header>
      <main>
        {page ?? (
          <>
            <div className="logo">
              <svg width="84" height="84" viewBox="0 0 84 84" aria-hidden="true"><circle cx="42" cy="42" r="40" fill="var(--pri)" /><path d="M26 44c0-10 6-18 14-18s14 6 14 14M30 52c6 8 18 8 26-2" stroke="var(--acc)" strokeWidth="6" fill="none" strokeLinecap="round" /><circle cx="26" cy="46" r="5" fill="#fff" /><circle cx="58" cy="46" r="5" fill="#fff" /></svg>
              <h2>CONECTA LIBRAS</h2><p>Conectando pessoas, tornando a comunicação acessível.</p>
            </div>
            <a className="btn p" href="#libras">🤟<span>LIBRAS → PORTUGUÊS<small>Câmera: sinais isolados cadastrados</small></span></a>
            <a className="btn p" href="#p2l">✍️<span>PORTUGUÊS → LIBRAS<small>Vídeos de sinais cadastrados</small></span></a>
            <a className="btn p" href="#v2l">🎤<span>VOZ → LIBRAS<small>Fala em texto, depois vídeos</small></span></a>
            <a className="btn p" href="#med">🩺<span>ATENDIMENTO MÉDICO<small>Mapa corporal e questionário</small></span></a>
            <a className="btn e" href="#em">🚨<span>EMERGÊNCIA<small>Comunicação rápida</small></span></a>
            <div className="grid2">
              <a className="btn" href="#dic">📖 Dicionário</a><a className="btn" href="#fav">⭐ Favoritos</a>
              <a className="btn" href="#cfg">♿ Acessibilidade</a><a className="btn" href="#sobre">ℹ️ Sobre</a>
            </div>
          </>
        )}
      </main>
    </>
  );
}
