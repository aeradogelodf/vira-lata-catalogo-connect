# Ajuste visual da tela de abertura instalada

## Objetivo
Melhorar a tela de abertura gerada pelo navegador, usando a logo oficial em alta definição, centralizada e sem distorção, sem alterar catálogo ou funcionalidades.

## Alterações
- Criar um manifesto de instalação porque o projeto ainda não possui um, preservando o nome “Agropet Vira Lata”.
- Gerar ícones 192×192 e 512×512 a partir da logo original de 1254×1254, sempre por redução de alta qualidade.
- Gerar ícone maskable 512×512 com margem de segurança para evitar cortes no Android.
- Manter uma fonte visual 1024×1024 e criar o ícone Apple 180×180 para telas de abertura compatíveis.
- Definir fundo neutro claro da identidade visual e vermelho oficial como cor do navegador.
- Vincular manifesto, cores e ícone Apple no cabeçalho global.

## Validação
- Conferir manifesto, dimensões, proporções, margens e arquivos servidos.
- Simular o recorte maskable e revisar visualmente centralização, nitidez e ausência de cortes.
- Validar no navegador em tamanho de celular e confirmar que catálogo e rotas permanecem inalterados.

## Limites
- Sem service worker ou modo offline.
- Sem mudanças em banco, permissões, login, rotas, conteúdo ou componentes do catálogo.
- A abertura instalada depende do navegador e do Android; a validação local verifica os mesmos metadados e imagens usados pelo sistema.
