export function speak(t: string) {
  if (!('speechSynthesis' in window)) { alert('Seu navegador não oferece leitura em áudio.'); return; }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(t); u.lang = 'pt-BR'; speechSynthesis.speak(u);
}
