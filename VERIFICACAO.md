# Verificação desta revisão

- Os seis testes unitários com dados sintéticos foram executados e passaram no Node.js 22.
- A instalação das dependências (`npm install`) não concluiu no ambiente de revisão. Portanto, **não** foi possível executar `npm run build`, `npm run typecheck` ou testar câmera, microfone, IndexedDB e navegação em navegador.
- Correções preventivas: liberar o rastreador de mãos caso a inicialização do rastreador de pose falhe; limpar a câmera e o stream após erro; cancelar contagem regressiva e gravação ao desligar a câmera.
- Reconhecimento de sinais isolados treinados pelo próprio usuário **não é tradução de Libras**.
- Para publicar, primeiro rode `npm install`, `npm run build:strict` e `npm test` em ambiente com rede. Corrija qualquer erro antes de fazer deploy.
