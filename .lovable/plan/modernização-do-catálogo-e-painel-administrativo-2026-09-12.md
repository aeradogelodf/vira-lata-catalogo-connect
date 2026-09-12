# Modernização do catálogo e painel administrativo

## Objetivo
Atualizar a experiência visual do catálogo público e do painel administrativo com uma linguagem mais moderna, clara e consistente, preservando todos os fluxos atuais e mantendo os módulos “em breve”.

## Direção visual aprovada
- Paleta equilibrada da marca: vermelho como assinatura, com verde, azul e amarelo em papéis de apoio.
- Títulos em Outfit e textos em Figtree.
- Composição minimalista em faixas amplas, controles compactos, hierarquia clara e cards de produtos mais objetivos.
- Microinterações discretas, foco visível, contraste adequado e respeito à preferência por movimento reduzido.

## Implementação
1. **Base visual compartilhada**
   - Refinar tokens de cor, tipografia, superfícies, bordas, sombras e estados no sistema visual existente.
   - Harmonizar cabeçalhos de página, campos, filtros, badges, estados vazios, alertas e ações.

2. **Catálogo público**
   - Modernizar `/catalogo`, cartões de produto, filtros, categorias, busca, ordenação e estados de resultado.
   - Refinar `/produto/$slug` e `/favoritos` para a mesma linguagem, mantendo galeria, compartilhamento, favoritos e WhatsApp.
   - Corrigir os problemas reais encontrados: número do WhatsApp no acesso direto, mensagem quando todos os itens estão ocultos, relacionados indisponíveis, contagens de categorias e acessibilidade da galeria.
   - Remover a consulta sem uso que hoje atrasa a Home, sem alterar sua organização visual já aprovada.

3. **Painel administrativo**
   - Modernizar a Central de Controle, navegação responsiva, métricas, cabeçalhos, listas, filtros, formulários, abas, diálogos e estados dos módulos existentes.
   - Aplicar consistência visual aos produtos, categorias, marcas, serviços, Banho & Tosa, banners, configurações e perfil.
   - Manter os módulos futuros visíveis e marcados como “em breve”.
   - Corrigir textos desatualizados, confirmação de exclusão durante processamento e navegação de módulos sem mudar regras de negócio.

4. **Estabilidade e desempenho**
   - Preservar autenticação, permissões, banco, armazenamento e fluxo comercial.
   - Corrigir conflitos de edição ainda não protegidos em portes, preços, banners e serviços.
   - Reforçar validação de imagens e evitar arquivos órfãos ao cancelar banners.
   - Melhorar consistência de buscas e registros de erro, sem expor detalhes técnicos ao usuário.

## Validação
- Executar verificações automáticas do projeto.
- Testar catálogo, produto, favoritos, WhatsApp e painel autenticado.
- Conferir telas em 390 px, tablet e desktop, sem sobreposição ou rolagem lateral.
- Verificar teclado, foco, contraste, estados de carregamento/erro/vazio e console.

## Entrega
Relatório organizado com arquivos alterados, melhorias visuais, correções funcionais, desempenho, segurança, testes realizados, limitações e confirmação do que permaneceu inalterado.
