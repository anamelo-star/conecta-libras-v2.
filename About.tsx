export default function About() {
  return (
    <>
      <div className="card"><h2>Conecta Libras</h2><p>Apoio à comunicação em atendimento ao público, ligado à pesquisa “O uso de aplicativos de tradução Português–Libras no atendimento ao público: possibilidades e limitações”.</p></div>
      <div className="card warn"><h2>Limitações</h2><ul>
        <li>Libras → Português reconhece só <b>sinais isolados cadastrados</b>; não traduz frases nem conversas. Sinais cadastrados não são validados por especialistas.</li>
        <li>Português → Libras só toca vídeos cadastrados, para o termo exato. Não há avatar nem VLibras integrados: não foi possível verificar licença, API e uso programático.</li>
        <li>Expressões faciais não são analisadas. A precisão do reconhecimento não foi medida.</li>
        <li>Voz → texto depende do serviço de voz do navegador (Chrome/Edge).</li></ul></div>
      <div className="card"><h2>Privacidade (LGPD)</h2><p>O vídeo da câmera é processado no aparelho e não é gravado nem enviado. Ficam salvos localmente só os números dos pontos do corpo dos sinais cadastrados, o modelo, os vídeos cadastrados, as preferências e os favoritos. Dados do atendimento médico ficam apenas na memória da aba. O reconhecimento de fala pode usar servidor do navegador. Você pode apagar tudo em Acessibilidade.</p></div>
    </>
  );
}
