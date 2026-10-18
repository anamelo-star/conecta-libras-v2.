// Ponto de extensão para Português → Libras. Hoje só vídeos cadastrados funcionam.
export interface SignRenderer { id: string; name: string; available: boolean; reason?: string; canRender(text: string): Promise<boolean> }
export const avatarRenderer: SignRenderer = {
  id: 'avatar', name: 'Avatar de Libras (ex.: VLibras)', available: false,
  reason: 'Integração preparada (interface), porém NÃO implementada: falta verificar licença, API/plugin e compatibilidade.',
  canRender: async () => false,
};
