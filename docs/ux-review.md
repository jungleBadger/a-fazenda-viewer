# Revisão de UX/UI — versão 1.3.0

Referências: Erik D. Kennedy, [7 Rules for Creating Gorgeous UI — parte 1](https://www.learnui.design/blog/7-rules-for-creating-gorgeous-ui-part-1.html) e [parte 2](https://www.learnui.design/blog/7-rules-for-creating-gorgeous-ui-part-2.html). A revisão aplica seus princípios à barra de um player, onde preservar a área de vídeo importa.

| Observação anterior | Mudança aplicada |
| --- | --- |
| Sinais e modos de exibição pareciam uma única lista | Grupos separados, com espaço e divisor entre eles |
| Sinal selecionado e miniplayer aberto competiam em amarelo | Dourado para o sinal atual; estado do mosaico em verde discreto |
| Controles pequenos e texto apertado | Botões com 40 px de altura e espaçamento consistente |
| Peso do texto mudava ao selecionar um sinal | Peso constante para impedir saltos na largura dos botões |
| Atalhos disputavam espaço com as ações | Texto auxiliar menos destacado; títulos dos botões preservam as dicas |
| Barra podia ficar apertada em janelas pequenas | Seis sinais em uma grade; modos em uma linha seguinte abaixo de 760 px |
| Foco e estado de “lado a lado” pouco explícitos | Contorno de foco e estado `aria-pressed` também no modo lado a lado |
| Mensagem de permissão aparecia durante a troca | Cobertura de carregamento por no máximo 1,8 s, encerrada quando o vídeo reproduz |

A cobertura só é usada na troca do sinal principal. Não clica em “Ok”, altera login ou autorizações, nem oculta erros indefinidamente. O tempo limite também funciona quando não existe vídeo, a navegação falha ou o DOM chega tarde.

## Verificação

27 testes locais cobrem abas, PiP, navegação, atalhos e o limite da cobertura. A prévia em `tools/preview.html` usa os scripts reais de interface com uma sessão simulada, sem conteúdo do RecordPlus. A revisão visual verifica janelas de desktop e janelas estreitas, seleção e mensagens persistentes.

Pendente antes da publicação: verificar a troca dos seis sinais, login, mensagens persistentes e PiP em uma sessão real do RecordPlus. A sessão do Chrome instalada pelo usuário não está conectada a este chat.
