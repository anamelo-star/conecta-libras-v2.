export interface Cfg { fs: number; hc: boolean; anim: number }
export default function Settings({ cfg, setCfg }: { cfg: Cfg; setCfg: (c: Cfg) => void }) {
  const wipe = () => {
    if (!confirm('Apagar preferências, favoritos, sinais, modelo e vídeos deste aparelho?')) return;
    try { localStorage.clear(); } catch { /* ok */ }
    const r = indexedDB.deleteDatabase('conecta-libras');
    r.onsuccess = r.onerror = r.onblocked = () => location.reload();
  };
  return (
    <>
      <div className="card"><label htmlFor="fs"><b>Tamanho das letras: {cfg.fs}%</b></label><input id="fs" type="range" min={85} max={160} step={5} value={cfg.fs} style={{ width: '100%' }} onChange={(e) => setCfg({ ...cfg, fs: +e.target.value })} /></div>
      <div className="card"><label><input type="checkbox" checked={cfg.hc} onChange={(e) => setCfg({ ...cfg, hc: e.target.checked })} /> Alto contraste</label></div>
      <div className="card"><label htmlFor="an"><b>Animações</b></label><select id="an" value={cfg.anim} onChange={(e) => setCfg({ ...cfg, anim: +e.target.value })}><option value={1}>Normais</option><option value={3}>Lentas</option><option value={0}>Desligadas</option></select></div>
      <p>Navegação por teclado: Tab, Enter e Espaço. Botões e regiões do mapa têm rótulos para leitores de tela.</p>
      <button className="btn e" onClick={wipe}>Apagar todos os dados locais</button>
    </>
  );
}
