// Persistência local (IndexedDB): sinais/exemplos, modelo e vídeos. Nada sai do aparelho.
export interface VideoRec { key: string; term: string; cat: string; src: string; valid: boolean; blob: Blob }
export const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\p{L}\p{N} ]/gu, '').trim().replace(/\s+/g, ' ');
let conn: Promise<IDBDatabase> | null = null;
const open = () => (conn ??= new Promise((res, rej) => {
  const r = indexedDB.open('conecta-libras', 1);
  r.onupgradeneeded = () => {
    r.result.createObjectStore('signs', { keyPath: 'id' });
    r.result.createObjectStore('videos', { keyPath: 'key' });
    r.result.createObjectStore('meta', { keyPath: 'key' });
  };
  r.onsuccess = () => res(r.result);
  r.onerror = () => rej(r.error);
}));
async function run<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const d = await open();
  return new Promise((res, rej) => {
    const r = fn(d.transaction(store, mode).objectStore(store));
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
export const db = {
  all: <T,>(s: string) => run<T[]>(s, 'readonly', (o) => o.getAll() as IDBRequest<T[]>),
  put: (s: string, v: unknown) => run(s, 'readwrite', (o) => o.put(v)),
  del: (s: string, k: string) => run(s, 'readwrite', (o) => o.delete(k)),
};
