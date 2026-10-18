import { useState } from 'react';
// Estado salvo no localStorage (apenas preferências e frases comuns; nunca dados de pacientes).
export function useLocal<T>(key: string, init: T): [T, (v: T) => void] {
  const [v, setV] = useState<T>(() => { try { const s = localStorage.getItem(key); return s ? (JSON.parse(s) as T) : init; } catch { return init; } });
  return [v, (n: T) => { setV(n); try { localStorage.setItem(key, JSON.stringify(n)); } catch { /* sem armazenamento */ } }];
}
