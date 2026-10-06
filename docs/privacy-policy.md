# Política de privacidade — Fazenda viewer • F18

Atualizada em 5 de outubro de 2026.

Fazenda viewer • F18 é uma extensão independente para facilitar a navegação entre os sinais de A Fazenda 18 no RecordPlus. Não é um produto da RECORD ou do RecordPlus.

## Dados usados pela extensão

A extensão acessa elementos do player e seu estado de reprodução nas páginas do RecordPlus, e gerencia as abas e janelas que ela mesma abre. Isso permite trocar sinais, mostrar controles, abrir o mosaico e acompanhar o estado do miniplayer.

Identificadores das abas e janelas, tamanho das janelas, modo de exibição e estado temporário de navegação são guardados apenas na sessão local do Chrome, por meio de `chrome.storage.session`. Não são enviados ao desenvolvedor e não formam um histórico de navegação. O estado do viewer é removido quando sua aba principal é fechada; o armazenamento de sessão também é apagado ao encerrar o navegador, desativar, recarregar ou atualizar a extensão.

As preferências de ativar ou desativar os atalhos e de ocultar a barra automaticamente são guardadas no dispositivo em `chrome.storage.local`, para serem mantidas quando você reabre o viewer. Elas não são enviadas a um servidor e são removidas ao desinstalar a extensão. A fonte da interface acompanha o pacote; não é carregada de um serviço externo durante o uso.

A extensão não coleta credenciais, informações de pagamento, dados de identidade, mensagens ou conteúdo de outros sites. Não contém telemetria, publicidade, ferramentas de análise ou rastreadores, e não vende ou compartilha dados pessoais.

## RecordPlus

Login, assinatura, reprodução e limites de uso são administrados pelo próprio RecordPlus na sessão normal do navegador. A extensão não recebe suas credenciais, extrai streams ou redistribui áudio ou vídeo. As páginas e os players originais continuam sujeitos às políticas do RecordPlus.

## Permissões

- `storage`: guardar o estado temporário do viewer na sessão e as preferências locais dos controles.
- Acesso a `recordplus.com` e `www.recordplus.com`: adicionar os controles e interagir com o player nas abas do viewer. Não é solicitado acesso a todos os sites.

## Controle do usuário

Você pode fechar o viewer, desativar ou desinstalar a extensão em `chrome://extensions`. A extensão não mantém uma base de usuários ou dados em servidor.

## Contato e alterações

Dúvidas podem ser enviadas pelo [suporte no GitHub](https://github.com/jungleBadger/a-fazenda-viewer/issues). Esse serviço é externo e segue sua própria política de privacidade; não inclua senhas ou dados privados em issues públicas.

Mudanças nesta política serão publicadas neste endereço. Caso uma versão futura passe a lidar com novos dados, isso será informado antes da coleta e a descrição de privacidade da loja será atualizada.
