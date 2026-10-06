# Revisão de UX/UI — versão 1.3.1

Referências: Erik D. Kennedy, [7 Rules for Creating Gorgeous UI — parte 1](https://www.learnui.design/blog/7-rules-for-creating-gorgeous-ui-part-1.html) e [parte 2](https://www.learnui.design/blog/7-rules-for-creating-gorgeous-ui-part-2.html). A revisão aplica seus princípios à barra de um player, onde preservar a área de vídeo importa.

| Observação anterior | Mudança aplicada |
| --- | --- |
| Sinais e modos de exibição pareciam uma única lista | Grupos separados, com espaço e divisor entre eles |
| Sinal selecionado e miniplayer aberto competiam em amarelo | Dourado para o sinal atual; estado do mosaico em verde discreto |
| Controles pequenos e texto apertado | Botões com 40 px de altura e espaçamento consistente |
| Peso do texto mudava ao selecionar um sinal | Peso constante para impedir saltos na largura dos botões |
| Atalhos disputavam espaço com as ações | Ajuda dos atalhos e GitHub em Mais opções, à direita; títulos dos botões preservam as dicas quando os atalhos estão ativos |
| Barra podia ficar apertada em janelas pequenas | Grade abaixo de 1.000 px, com os modos em uma linha seguinte; abaixo de 760 px, sinais em um grupo próprio; abaixo de 360 px, grade de três colunas |
| Foco e estado de “lado a lado” pouco explícitos | Contorno de foco e estado `aria-pressed` também no modo lado a lado |
| Mensagem de permissão aparecia durante a troca | Cobertura de carregamento por no máximo 1,8 s, encerrada quando o vídeo reproduz |
| Fundo sólido da barra pesava visualmente | Transparência leve com desfoque, controles opacos e alternativa sem transparência |

A cobertura só é usada na troca do sinal principal. Não clica em “Ok”, altera login ou autorizações, nem oculta erros indefinidamente. O tempo limite também funciona quando não existe vídeo, a navegação falha ou o DOM chega tarde.

## Espaço de vídeo e tipografia

Na prévia desktop de 1.280 × 800 px, a barra visível reserva 69 px (8,6% da altura). A 940 × 800 px, reserva 121 px (15,1%). Em uma janela de 390 × 700 px, reserva aproximadamente 157 px (22,5%). Por isso, Ocultar barra automaticamente é uma opção, desligada por padrão.

Quando ativada, a barra passa a sobrepor o vídeo e recolhe após 2,5 s sem interação. O player usa toda a altura tanto com a barra aberta quanto recolhida. Ponteiro, foco, menu, dicas de PiP e mensagens da extensão impedem o recolhimento. Mostrar e esconder não provoca saltos no tamanho do vídeo. Botão de abertura, atalho Alt + Shift + F e Escape permitem uso por teclado; controles recolhidos ficam inertes.

A [página oficial do programa no RecordPlus](https://descubra.recordplus.com/afazenda18/) mostra lettering forte, condensado e em caixa alta nas imagens dos sinais. A interpretação do viewer usa Teko Bold apenas no título, com identificação discreta de viewer e temporada; as ações mantêm a fonte de interface. É uma aproximação visual, não uma identificação da fonte exata do logotipo. A fonte vem do [repositório Google Fonts](https://github.com/google/fonts/tree/main/ofl/teko) e acompanha o pacote sob SIL OFL, sem solicitações externas durante o uso.

## Verificação

37 testes locais cobrem abas, PiP, navegação, atalhos, menu, foco, preferência dos atalhos e o limite da cobertura. A prévia em `tools/preview.html` usa os scripts reais de interface com uma sessão simulada, sem conteúdo do RecordPlus. A revisão visual verifica janelas de desktop e janelas estreitas, seleção e mensagens persistentes.

## Acessibilidade

Mais opções segue o [padrão de divulgação de conteúdo do W3C](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/): botão nativo com nome, `aria-expanded` e `aria-controls`, conteúdo oculto quando fechado e controles nativos dentro do painel. Enter e Espaço abrem e fecham; Tab segue a ordem normal, sem prender o foco; Escape fecha e devolve foco ao botão. Clique fora e saída de foco para outro controle também fecham o painel.

O link do GitHub informa que abre em nova aba. O painel e as ações têm rótulos em português, foco visível e tamanho adequado; o botão Mais opções tem 44 × 44 px. A barra também respeita movimento reduzido, transparência reduzida e cores forçadas.

A opção de desativar atalhos atende ao mecanismo previsto pelo [WCAG 2.1.4 para atalhos de caracteres](https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts.html), ajudando a evitar acionamento acidental por entrada de voz. A preferência persiste no dispositivo. As teclas ficam suspensas enquanto o painel está aberto; os botões continuam disponíveis com os atalhos desligados.

Navegação por teclado e rótulos foram verificados na árvore de acessibilidade do navegador. Uma revisão com leitor de tela e reprodução real continua pendente antes da publicação.

Pendente antes da publicação: verificar a troca dos seis sinais, login, mensagens persistentes e PiP em uma sessão real do RecordPlus. A sessão do Chrome instalada pelo usuário não está conectada a este chat.
