# A Fazenda viewer · F18

Extensão independente para acompanhar A Fazenda 18 no RecordPlus, com atalhos entre sinais, mosaico flutuante e visualização lado a lado.

**Gratuita, sem anúncios ou telemetria da extensão.** Usa os players originais e sua sessão normal do Chrome. O acesso aos sinais exige sua própria conta do RecordPlus com os direitos necessários. Não é afiliada à RECORD ou ao RecordPlus.

![Prévia da interface, sem transmissão ao vivo](store/ui-preview-desktop.jpg)

## Disponibilidade

A versão **1.3.0** está em preparação para a Chrome Web Store. Ainda não há um link aprovado da loja. O pacote de teste e o código estão neste repositório; a reprodução real precisa ser verificada antes do envio.

Esta versão é específica para **A Fazenda 18**. Os sete links oficiais ficam em `viewer-ui.js`, compartilhado pela interface e pelo serviço de fundo. Descoberta automática e suporte a temporadas futuras ainda não estão disponíveis.

## Testar ou atualizar localmente

1. Baixe e extraia o ZIP da [versão de teste](https://github.com/jungleBadger/a-fazenda-viewer/releases).
2. Abra `chrome://extensions` no Chrome.
3. Para atualizar esta pasta já instalada, clique em **Recarregar** e confira **1.3.0**. Para instalar pela primeira vez, ative **Modo do desenvolvedor**, clique em **Carregar sem compactação** e selecione a pasta que contém `manifest.json`.
4. Feche as janelas antigas do viewer e clique no ícone da extensão para abrir a nova versão.

As permissões continuam limitadas ao armazenamento de sessão e aos domínios do RecordPlus.

## Novidades da 1.3.0

- Barra com grupos separados para sinais e modos do mosaico, seleção mais clara e adaptação a janelas estreitas.
- Cobertura breve durante a troca do sinal principal para suavizar a mensagem transitória de permissão, com prazo máximo de 1,8 s.
- Lista única de links F18, ícones próprios e materiais para publicação.

## Mosaico flutuante

1. No sinal principal, clique em **Mosaico flutuante** ou pressione **M**. A extensão abre a aba do mosaico na mesma janela, sem diminuir o sinal principal.
2. Espere o vídeo aparecer; clique em Play se necessário.
3. Clique em **Abrir miniplayer** ou pressione **M** na aba do mosaico. O Chrome exige uma ação nessa página para abrir PiP; não é possível prometer abertura automática a partir do sinal principal.
4. O mosaico fica em uma janela de vídeo flutuante, sem som, e a extensão retorna ao sinal principal. Arraste e redimensione o miniplayer pelo próprio Chrome.
5. Use **1–6** na página principal para trocar de sinal. **M** no sinal principal fecha o miniplayer e pausa o mosaico. O X da janela flutuante também atualiza o estado dos controles.

Mantenha a aba do mosaico aberta: ela alimenta o miniplayer. Não é criada uma segunda janela normal do Chrome neste modo. Para reabrir após fechar, repita a ação de abrir na aba do mosaico; a mesma aba é reutilizada.

O PiP de vídeo mostra apenas o vídeo e os controles fornecidos pelo Chrome. Os botões dos seis sinais ficam na página principal. Os atalhos precisam de foco em uma página do viewer; eles não são globais e não funcionam com foco na janela nativa de PiP.

Se o player, o navegador ou a política do site não permitir PiP, a extensão mostra uma explicação e preserva **Ver lado a lado**. Não altera políticas, permissões de reprodução ou `disablePictureInPicture` do vídeo.

## Sinais e atalhos

- **Sinal 1–6** / teclas **1–6**: troca diretamente o sinal principal e conserva o mosaico. Escolher o sinal atual não reinicia o player.
- **M**: no sinal principal, prepara ou fecha o mosaico flutuante; na aba do mosaico, abre ou fecha seu miniplayer.
- **Voltar ao sinal**: retorna ao principal sem abrir PiP. Cancela a preparação de um mosaico ainda não aberto.
- Os atalhos ficam desativados em campos de texto e seletores, durante composição de texto e com Ctrl, Command ou Alt. Segurar a tecla não provoca trocas repetidas.
- Esses atalhos substituem a função original das teclas no player (por exemplo, silenciar com M).
- Os controles originais de reprodução, login e tela cheia continuam no RecordPlus.

## Ver lado a lado

**Ver lado a lado** conserva o modo anterior. Em versões com Split View disponível à extensão, usa a divisão nativa da janela. Nas demais versões, abre duas janelas dedicadas, com o mosaico sem som. **Ocultar lado a lado** pausa e conserva o mosaico, restaurando o tamanho do principal.

É possível alternar entre os dois modos sem criar outro mosaico. A janela original em que você estava navegando não é redimensionada. Fechar a aba principal também fecha a aba do mosaico criada pela extensão.

## Limitações e verificação

Login, limites de reprodução simultânea e mensagens de permissão são definidos pelo RecordPlus. Na troca do sinal principal, uma cobertura de carregamento dura no máximo 1,8 s ou termina quando o vídeo reproduz. Ela suaviza a mensagem transitória de permissão; erros persistentes continuam visíveis após esse prazo. Não altera a autorização do player.

Os 27 testes locais simulam a API do Chrome e o player para verificar criação/reutilização das abas, troca de sinais, fallback lado a lado, eventos de entrada/saída de PiP, pausa, atalhos e bloqueios de PiP. Também verificam o prazo da cobertura, erros de navegação e a preservação do PiP nativo do sinal principal. Não validam a reprodução ao vivo ou a disponibilidade de PiP com sua conta. O Chrome do usuário não está conectado às ferramentas de teste deste chat.

Referências oficiais:
- https://developer.chrome.com/blog/watch-video-using-picture-in-picture
- https://developer.chrome.com/docs/extensions/reference/api/tabs#method-createSplit

Para remover, desinstale a extensão em `chrome://extensions`.

## Desenvolvimento e publicação

```sh
node --test tests/*.test.cjs
python3 tools/package.py
```

O ZIP em `dist/` inclui apenas o manifesto, os scripts utilizados e os ícones. Não inclui testes, documentação ou capturas. Os testes também rodam no GitHub a cada alteração.

- [Revisão de UX/UI e referências de Erik D. Kennedy](docs/ux-review.md)
- [Política de privacidade](docs/privacy-policy.md)
- [Descrição da loja, justificativas e instruções de teste](store/listing.md)
- [Changelog](CHANGELOG.md)

Suporte: [issues do GitHub](https://github.com/jungleBadger/a-fazenda-viewer/issues).
