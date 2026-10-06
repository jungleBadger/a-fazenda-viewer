# Desenvolvimento e verificação

## Executar as verificações

```sh
node --test tests/*.test.cjs
python3 tools/package.py
```

Os 37 testes locais simulam a API do Chrome e o player para verificar criação e reutilização das abas, troca de sinais, fallback lado a lado, eventos de PiP, pausa, atalhos e bloqueios de PiP. Também verificam o prazo da cobertura, erros de navegação, a preservação do PiP nativo do sinal principal, abertura e fechamento do menu, foco, preferências e proteção contra recolhimento durante a interação.

O ZIP em `dist/` inclui o manifesto, os scripts utilizados, os ícones, a fonte local e as licenças. Não inclui testes, documentação ou capturas. Os testes e o empacotamento também rodam no GitHub a cada alteração enviada.

## Prévia da interface

`tools/preview.html` usa os scripts reais com uma sessão simulada, sem transmissão do RecordPlus. Sirva a raiz do projeto por HTTP e abra `/tools/preview.html`. Acrescente `?role=mosaic` para revisar a aba do mosaico ou `?persistent-error` para verificar se uma mensagem persistente reaparece após a cobertura breve.

O menu foi verificado por teclado e pela árvore de acessibilidade do navegador, em desktop e em janela estreita. Esses testes não substituem uma sessão real de reprodução ou uma revisão com leitor de tela.

## Antes de publicar

Verifique os seis sinais, login, mensagens persistentes, PiP e foco na sessão real do RecordPlus. Os testes locais não validam a reprodução ao vivo ou a disponibilidade de PiP com a conta do usuário. O Chrome do usuário não está conectado às ferramentas de teste deste chat.

Esta versão é específica para A Fazenda 18. Os sete links oficiais ficam em `viewer-ui.js`, compartilhado pela interface e pelo serviço de fundo. Descoberta automática e suporte a temporadas futuras ainda não estão disponíveis.

- [Revisão de UX/UI e acessibilidade](ux-review.md)
- [Materiais da Chrome Web Store](../store/listing.md)
- [Changelog](../CHANGELOG.md)

Referências oficiais: [PiP de vídeo](https://developer.chrome.com/blog/watch-video-using-picture-in-picture) e [Split View](https://developer.chrome.com/docs/extensions/reference/api/tabs#method-createSplit).

[Voltar ao README](../README.md)
