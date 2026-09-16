# M01 — Estoque Inteligente

## Objetivo
Ativar o item **Estoque** como uma central operacional completa, reutilizando `products.stock`, `products.min_stock`, preços, produtos e o padrão visual do painel atual. O catálogo, a Home, SEO, PWA e os demais módulos permanecem com a experiência existente.

## Estado confirmado
- `products.stock` e `products.min_stock` já existem, aceitam apenas valores não negativos e já alimentam a disponibilidade pública.
- `store_settings.hide_out_of_stock` já controla a ocultação de itens indisponíveis no catálogo.
- O catálogo considera `stock > 0` como disponível e usa cache de produtos de um minuto.
- O painel já usa autenticação protegida, verificação administrativa no servidor, TanStack Query e os componentes visuais compartilhados.
- Não existe tabela de movimentações, histórico, inventário ou função transacional de estoque.
- O armazenamento de imagens não participa deste módulo e não será alterado.

## Implementação

### 1. Histórico seguro e transacional
- Criar uma única tabela `inventory_movements` com produto, tipo, quantidade, estoque anterior, estoque atual, motivo/observação, responsável e data.
- Tipos: entrada, saída, ajuste e inventário.
- Manter o histórico permanente: sem permissões de edição ou exclusão para usuários do painel.
- Adicionar leitura somente para administradores, com RLS e concessões mínimas.
- Criar uma função transacional no banco que bloqueia o produto durante a operação, impede saldo negativo, atualiza `products.stock` e registra o histórico na mesma transação.
- Registrar automaticamente alterações de estoque feitas pelo cadastro de produtos, evitando pontos sem rastreabilidade e sem criar uma segunda fonte de saldo.

### 2. Funções administrativas
- Criar Server Functions autenticadas com validação no servidor e verificação de papel administrativo.
- Entregar consultas para resumo, produtos/alertas, movimentações pesquisáveis e relatório.
- Entregar operação única para entrada, saída, ajuste e inventário, com mensagens amigáveis e proteção contra concorrência.
- Reutilizar os dados existentes do produto; nenhuma quantidade será mantida fora de `products.stock`.

### 3. Central de Estoque
- Ativar `/admin/estoque` no menu existente.
- Exibir primeiro a **Visão Geral** com os indicadores: cadastrados, ativos, estoque baixo, zerado, valor estimado pelo preço de venda e última movimentação.
- Adicionar ações rápidas para Entrada, Saída, Ajuste e Inventário.
- Organizar abas para Visão Geral, Movimentações, Entrada, Saída, Ajuste, Inventário, Alertas e Relatórios.
- Movimentações terão busca e mostrarão data, produto, tipo, quantidade, saldo anterior, saldo atual e responsável.
- Alertas separarão baixo e zerado usando `min_stock`.
- Relatórios apresentarão resumo simples e exportação CSV no navegador.
- Incluir carregamento, vazio, erro, confirmação e retorno de sucesso, seguindo os mesmos componentes e tokens do painel.

### 4. Integração preservada
- Invalidar as consultas administrativas e do catálogo após cada operação.
- Manter a regra atual de disponibilidade e `hide_out_of_stock`; nenhuma tela pública será redesenhada.
- Manter o cadastro de produtos compatível, fazendo alterações de saldo passarem pela mesma rastreabilidade.

## Detalhes técnicos
- Nova tabela: `public.inventory_movements`, com RLS habilitada, leitura administrativa e escrita somente pela função controlada.
- Função SQL atômica para cálculo, bloqueio e atualização do saldo; o servidor não confiará em cálculos enviados pela interface.
- `performed_by` será o identificador autenticado e o e-mail será armazenado como retrato do responsável, sem vínculo direto com a tabela interna de autenticação.
- Índices por produto/data e tipo/data para histórico e relatórios.
- Nova rota protegida e metadados `noindex`, sem alterar rotas públicas.

## Validação
- Typecheck e compilação automática.
- Testes funcionais de entrada, saída, bloqueio de saldo negativo, ajuste, inventário, alertas e CSV.
- Conferência de atualização automática da disponibilidade e da regra `hide_out_of_stock`.
- Verificação em celular e desktop, sem transbordamento e com console limpo.
- Qualquer teste dependente de instalação física ou condição externa será indicado no relatório final.
