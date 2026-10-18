# Conecta Libras (React + TypeScript + Vite)

Tudo em um único app React: Libras → Português (câmera), Português → Libras (vídeos), Voz → Libras, Atendimento médico, Emergência, Dicionário, Favoritos e Acessibilidade.

## Abrir no celular SEM instalar nada (publicar com link)
Você não precisa de Node.js: a Vercel/Netlify compila na nuvem.
1. Descompacte o ZIP no computador.
2. Crie uma conta gratuita em github.com → **New repository** (nome: `conecta-libras`) → **uploading an existing file** → arraste **todo o conteúdo** da pasta descompactada (inclusive `.gitignore`) → **Commit changes**.
3. Em vercel.com (ou netlify.com) entre com o GitHub → **Add New Project** / **Import** → escolha `conecta-libras` → **Deploy** (as configurações já vêm em `vercel.json` e `netlify.toml`).
4. Ao terminar, a plataforma mostra o link `https://…vercel.app` (ou `.netlify.app`). Abra no celular. É HTTPS, necessário para câmera e microfone.
O build baixa os modelos do MediaPipe (precisa de internet na nuvem, o que é o normal). Se baixar falhar, o app tenta as URLs públicas do MediaPipe ao ligar a câmera.

## Rodar no computador
Node.js 20+: `npm install` → `npm run dev` (http://localhost:5173). Celular na mesma rede: `npm run dev:https`.
Scripts: `npm run build` · `npm run build:strict` (com checagem de tipos) · `npm run typecheck` · `npm test`.

## Cadastrar sinais (Libras → Português)
Libras → Português → **Cadastrar sinais** → toque num sinal sugerido (ou crie outro) → **Ligar câmera** (permitir) → **Gravar exemplo** (contagem de 3 s, faça o sinal em 2 s). Grave 8 ou mais exemplos, variando posição, distância e velocidade; mostre ombros e mãos → **Treinar**. Depois, aba **Reconhecer**.

## Testar o reconhecimento
Cadastre 2 ou 3 sinais bem diferentes, treine e faça cada um 10 vezes; anote acertos, erros e “não reconhecido”. Faça também gestos aleatórios: devem dar “Sinal não reconhecido”. Ajuste a confiança mínima. Sinais parecidos geram aviso no treino. Luz frontal e enquadramento fixo ajudam.

## Cadastrar vídeos (Português → Libras)
Português → Libras → **Cadastrar vídeo**: termo exato, categoria, fonte/licença, marque “validado” só se um especialista validou. Os vídeos ficam no IndexedDB do aparelho (permanentes até apagar). Use só vídeos próprios ou autorizados.

## Implementado
Câmera + MediaPipe (mãos e pose); cadastro, gravação, treino (vizinho mais próximo com limiar por leave-one-out) e reconhecimento ao vivo com confiança e rejeição; persistência local de sinais, modelo e vídeos; Português → Libras por vídeo exato com velocidade e repetir; Voz → texto editável (Web Speech API) → vídeo; mapa corporal frente/costas, dor 0–10, questionário, resumo com copiar/limpar; 10 frases de emergência com áudio; dicionário por categorias; favoritos; alto contraste, tamanho de letra, animações, teclado.

## Limitações
- Reconhece apenas **sinais isolados cadastrados**; não é tradução de Libras. Sinais cadastrados não são validados por especialistas.
- Sem avatar/VLibras: não verificado (licença, API, uso programático). Só há a interface `src/lib/signRenderer.ts`.
- Sem expressões faciais, sem rede neural (TF.js), sem frases em Libras.
- Dicionário: lista de termos sem vídeos incluídos; cadastre os seus.
- Voz depende do navegador (Chrome/Edge; Safari/Firefox variam ou não têm).
- Sem verificação de precisão com sinais reais.

## O que foi e não foi testado ao criar o projeto
Testado: lógica pura (`npm test`, 6 testes) e tipos das libs. **Não testado:** `npm install`, `npm run build`, câmera, MediaPipe, microfone, IndexedDB, layout no celular e as telas React (sem rede e sem navegador no ambiente de criação). Rode `npm run build:strict` ou faça o deploy e veja o log; qualquer erro de tipo não bloqueia o `npm run build`.


## Publicacao na Vercel (correcao)
O npm install nao executa mais o script MediaPipe automaticamente. O aplicativo tenta usar os arquivos locais e, se nao existirem, carrega o WASM e os modelos pelas URLs publicas em src/lib/mp.ts (requer internet). Para preparar arquivos locais opcionalmente, execute npm run setup:mediapipe antes do build. Configure Framework Vite, build npm run build, output dist e install npm install.
