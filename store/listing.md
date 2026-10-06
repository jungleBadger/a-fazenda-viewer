# Chrome Web Store — conteúdo para envio

Nome: **Fazenda viewer • F18**

Resumo: **Ferramenta independente para A Fazenda 18: atalhos entre seis sinais e mosaico flutuante ou lado a lado no RecordPlus.**

Idioma: português do Brasil. Categoria sugerida: entretenimento. Distribuição: gratuita; lançamento público após teste com a sessão real.

## Descrição

Acompanhe A Fazenda 18 com os players originais do RecordPlus e controles que deixam a troca de câmeras mais prática.

• Troque entre os seis sinais pelos botões ou pelas teclas 1–6.
• Mantenha o mosaico em um miniplayer flutuante e sem som.
• Veja o sinal principal e o mosaico lado a lado.
• Use M para preparar, abrir ou fechar o miniplayer.
• Reutilize a aba do mosaico ao trocar o sinal principal.

Para começar, entre no RecordPlus com sua própria conta e clique no ícone da extensão. Para abrir o miniplayer, clique em “Abrir miniplayer” na aba do mosaico; o Chrome exige uma ação nessa página.

A extensão é gratuita. O acesso aos sinais exige uma conta do RecordPlus com os direitos de reprodução necessários. Assinatura, login e limites de telas continuam definidos pelo RecordPlus. A disponibilidade do miniplayer depende do player e do navegador.

Esta versão foi feita para A Fazenda 18. Links de futuras temporadas poderão exigir uma atualização.

Ferramenta independente, sem vínculo com a RECORD ou o RecordPlus. Não desbloqueia conteúdo, baixa vídeos ou distribui transmissões. Sem anúncios ou telemetria da extensão.

## Propósito único

Facilitar a visualização de A Fazenda 18 no RecordPlus, com seleção dos sinais e organização do mosaico em miniplayer ou lado a lado.

## Justificativas de permissões

`storage`: salvar IDs de abas/janelas, dimensões e estado de exibição em `chrome.storage.session`, apenas no dispositivo, para reutilizar o mosaico e restaurar as janelas. Guardar a preferência de ativar ou desativar os atalhos em `chrome.storage.local`.

Permissões de host do RecordPlus: injetar os controles nas páginas oficiais e acompanhar o elemento de vídeo e seu estado nas abas gerenciadas pelo viewer.

Código remoto: **não utiliza código remoto**. Os scripts da extensão estão incluídos no pacote.

Práticas de dados: acesso local aos elementos do player e ao estado das abas/janelas; nenhuma transmissão desses dados ao desenvolvedor. As declarações do formulário devem refletir esse acesso local e a política de privacidade.

Privacidade: https://github.com/jungleBadger/a-fazenda-viewer/blob/main/docs/privacy-policy.md
Suporte: https://github.com/jungleBadger/a-fazenda-viewer/issues
Código: https://github.com/jungleBadger/a-fazenda-viewer

## Instruções ao revisor

1. Use uma conta de teste do RecordPlus autorizada a assistir aos sete sinais de A Fazenda 18. Não há login específico da extensão. Fornecer credenciais de teste apenas no campo privado da loja, se solicitado; nunca neste repositório.
2. Clique no ícone da extensão. O Sinal 1 deve abrir em uma janela dedicada.
3. Troque entre 1–6 e confirme que o player original reproduz cada sinal.
4. Clique em “Mosaico flutuante”. Na aba aberta, espere o vídeo e clique em “Abrir miniplayer”. O mosaico deve ficar sem som e o foco voltar ao principal.
5. Troque o sinal principal, feche o miniplayer e confirme que a aba do mosaico é reutilizada.
6. Teste “Ver lado a lado”. Em navegadores sem Split View acessível à extensão, devem abrir duas janelas dedicadas.
7. Uma troca mostra “Abrindo sinal…” por no máximo 1,8 s; uma mensagem persistente de login/permissão continua visível após esse prazo.

## Materiais

- Ícone de 128 px: `icons/icon-128.png`.
- Imagem promocional: `store/promo-440x280.png`.
- Capturas locais de interface: `store/ui-preview-*.jpg`, identificadas como prévias, sem transmissão ao vivo. Substituir ou complementar com capturas reais após validar a sessão.
- ZIP: gerado por `python3 tools/package.py` em `dist/`.

## Etapas restantes

- Entrar na conta Google do publicador e concluir o cadastro/pagamento único, se ainda necessário.
- Validar reprodução real e a transição na extensão recarregada.
- Subir o ZIP e preencher os campos acima, revisar as práticas de dados e fornecer instruções privadas de teste.
- Enviar para análise. Não anunciar disponibilidade na loja antes de existir um link público aprovado.
