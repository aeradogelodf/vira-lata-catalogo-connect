# Agropet Vira Lata Digital

PROMPT 00 — FUNDAÇÃO OFICIAL



AGROPET VIRA LATA OFICIAL — CATÁLOGO DIGITAL INTELIGENTE



Você está iniciando um novo projeto do zero chamado:



AGROPET VIRA LATA OFICIAL



Este projeto será um Catálogo Digital Inteligente + Vitrine Comercial + Ferramenta de Divulgação, desenvolvido para a Agropet Vira Lata.



O projeto deverá ser profissional, rápido, responsivo, escalável, administrável e preparado para uso real no dia a dia da empresa.



---



1. REGRA PRINCIPAL



Antes de implementar qualquer funcionalidade, compreenda completamente o modelo do projeto.



Este NÃO será um e-commerce tradicional.



Não construiremos o projeto com foco em:



- checkout tradicional;

- pagamento obrigatório dentro do site;

- gateway de pagamento;

- venda automática;

- marketplace;

- fechamento financeiro dentro do catálogo.



O modelo comercial será:



CATÁLOGO → INTERESSE → WHATSAPP → ATENDIMENTO → VENDA



O catálogo será responsável por apresentar, divulgar e converter.



O atendimento humano será responsável pelo fechamento da venda.



---



2. IDENTIDADE OFICIAL



Utilize inicialmente estas informações como BASE OFICIAL DO PROJETO.



Empresa



Agropet Vira Lata



Nome interno do projeto



Agropet Vira Lata Oficial



Segmento



Pet shop / agropecuária / produtos para animais / serviços pet.



Localização



Ceilândia Sul, QN 7, Conjunto B, Setor Norte, Brasília — DF



CEP



72215-072



WhatsApp oficial



(61) 3399-7123



Horário inicialmente identificado



Segunda a sexta:

07:00 às 19:00



Sábado:

08:00 às 19:00



Domingo:

Fechado



Essas informações são a base inicial e poderão posteriormente ser alteradas exclusivamente pelo painel administrativo.



---



3. OBJETIVO DO PRODUTO



Criar uma experiência digital onde o cliente consiga:



- conhecer a Agropet;

- visualizar seus produtos;

- navegar por categorias;

- pesquisar produtos;

- filtrar produtos;

- visualizar detalhes;

- conhecer promoções;

- descobrir serviços;

- favoritar produtos;

- compartilhar produtos;

- encontrar rapidamente produtos de interesse;

- entrar em contato pelo WhatsApp.



A experiência deve ser extremamente simples.



O usuário não deve precisar aprender a utilizar o sistema.



---



4. MODELO DE CONVERSÃO



Todo o projeto deve ser pensado para levar o usuário ao atendimento.



O fluxo principal deverá ser:



VISITANTE

↓

HOME

↓

CATEGORIA / BUSCA

↓

PRODUTO

↓

INTERESSE

↓

WHATSAPP

↓

ATENDIMENTO

↓

VENDA



O botão principal de ação dos produtos deverá direcionar para o WhatsApp.



A mensagem enviada deverá, sempre que possível, possuir contexto.



Exemplo:



"Olá! Vi no catálogo da Agropet Vira Lata o produto [NOME DO PRODUTO] e gostaria de saber mais informações."



Não utilizar mensagens genéricas quando for possível enviar contexto.



---



5. FAVORITOS



O projeto deverá possuir uma funcionalidade de favoritos.



O visitante poderá marcar produtos como favoritos sem precisar passar por um checkout.



O objetivo é permitir que o usuário:



- salve produtos;

- volte posteriormente;

- encontre produtos rapidamente;

- organize produtos de interesse;

- posteriormente entre em contato pelo WhatsApp.



Os favoritos NÃO representam um pedido.



Os favoritos NÃO devem transformar o sistema em e-commerce.



A arquitetura deverá permitir inicialmente persistência local no dispositivo e deverá ser preparada para futura persistência vinculada a uma conta de cliente, caso isso seja necessário.



---



6. ADMINISTRAÇÃO



O projeto deverá possuir uma área administrativa protegida.



Somente usuários autorizados como administradores poderão controlar o conteúdo.



O visitante público NÃO poderá:



- cadastrar produtos;

- alterar preços;

- alterar imagens;

- alterar categorias;

- publicar conteúdo;

- alterar configurações;

- acessar o painel.



A arquitetura deverá separar claramente:



ÁREA PÚBLICA



Somente visualização e interação comercial.



ÁREA ADMINISTRATIVA



Controle completo do catálogo e das configurações.



---



7. VISÃO FUTURA DO PAINEL



Não implemente o painel completo neste momento.



Porém, a arquitetura deve ser preparada para que futuramente o administrador consiga controlar:



Produtos



- nome;

- descrição;

- preço;

- preço promocional;

- imagens;

- categoria;

- marca;

- disponibilidade;

- destaque;

- promoção;

- ordem de exibição;

- SEO.



Categorias



- nome;

- descrição;

- imagem;

- ordem;

- status.



Marcas



- nome;

- imagem;

- descrição;

- status.



Promoções



- produto;

- desconto;

- período;

- status.



Banners



- imagem;

- título;

- subtítulo;

- link;

- ordem;

- status.



Serviços



- nome;

- descrição;

- preço;

- imagem;

- disponibilidade.



Configurações da loja



- nome;

- WhatsApp;

- endereço;

- horário;

- redes sociais;

- informações institucionais;

- identidade visual;

- configurações do catálogo.



---



8. ESTRUTURA DO CATÁLOGO



A arquitetura deverá contemplar futuramente:



HOME

├── Categorias

├── Produtos em destaque

├── Promoções

├── Produtos recomendados

├── Serviços

├── Conteúdo/divulgação

├── Informações da loja

└── WhatsApp



CATÁLOGO

├── Busca

├── Categorias

├── Marcas

├── Filtros

├── Ordenação

└── Produtos



PRODUTO

├── Imagens

├── Nome

├── Marca

├── Preço

├── Promoção

├── Disponibilidade

├── Descrição

├── Características

├── Favoritos

├── Compartilhar

├── Produtos relacionados

└── WhatsApp



FAVORITOS

├── Produtos salvos

└── Acesso rápido ao produto



SERVIÇOS

├── Banho e Tosa

└── Outros serviços futuros



---



9. DESIGN SYSTEM



Utilize a identidade visual já definida para o projeto.



Paleta principal



Vermelho

→ CTA, ação, conversão e identidade principal.



Verde

→ saúde, pets, disponibilidade e estados positivos.



Azul

→ confiança, informação e elementos complementares.



Amarelo

→ destaque, promoção e atenção.



Branco

→ contraste, limpeza e áreas principais.



Neutros

→ textos, fundos, bordas e estrutura.



Não invente uma nova identidade visual.



A identidade deverá transmitir:



- confiança;

- proximidade;

- profissionalismo;

- organização;

- modernidade;

- cuidado com animais;

- facilidade de compra/atendimento.



---



10. UX/UI



A experiência deverá ser:



MOBILE FIRST



O celular é a principal plataforma de utilização.



Priorize:



- navegação simples;

- busca rápida;

- categorias claras;

- cards objetivos;

- imagens de boa qualidade;

- CTAs evidentes;

- WhatsApp acessível;

- favoritos fáceis;

- carregamento rápido;

- poucos passos;

- excelente legibilidade.



O projeto deverá funcionar muito bem também em:



- tablet;

- desktop;

- telas grandes.



---



11. PERFORMANCE



Performance é requisito obrigatório.



O projeto deverá ser construído considerando:



- carregamento rápido;

- imagens otimizadas;

- lazy loading;

- dimensões adequadas das imagens;

- redução de JavaScript desnecessário;

- cache;

- consultas eficientes;

- componentes reutilizáveis;

- carregamento progressivo;

- prevenção de CLS;

- boa experiência em redes móveis.



Não criar uma aplicação visualmente pesada apenas para parecer sofisticada.



Priorizar:



velocidade + estabilidade + clareza + conversão.



---



12. SEO



A arquitetura deverá nascer preparada para SEO.



Considerar:



- URLs amigáveis;

- páginas individuais de produtos;

- títulos;

- meta descriptions;

- Open Graph;

- canonical;

- sitemap;

- robots;

- JSON-LD;

- Product;

- LocalBusiness;

- Organization;

- Breadcrumb;

- SEO local.



A localização da empresa deverá ser considerada na estratégia de SEO local.



---



13. SEGURANÇA



A arquitetura deverá possuir separação clara entre público e administrador.



Considerar desde o início:



- autenticação;

- autorização;

- proteção de rotas administrativas;

- banco protegido;

- RLS quando aplicável;

- validação de dados;

- proteção das operações administrativas;

- nenhuma chave secreta no frontend;

- princípio do menor privilégio.



---



14. ARQUITETURA TÉCNICA



Utilize uma arquitetura moderna e profissional.



A referência inicial do projeto anterior foi:



- TanStack Start;

- React;

- TypeScript;

- Tailwind CSS;

- Supabase/Lovable Cloud;

- PostgreSQL;

- Supabase Auth;

- Storage;

- TanStack Query.



Você pode utilizar essa mesma abordagem quando ela for tecnicamente adequada.



Porém:



não replique problemas arquiteturais do projeto anterior.



Especialmente:



- não criar catálogo estático paralelo ao banco;

- não hardcodar informações que deverão ser administráveis;

- não criar módulos desconectados;

- não criar duas fontes de verdade para os mesmos dados;

- não construir funcionalidades sem definir sua integração;

- não criar complexidade desnecessária.



Deve existir uma única fonte de verdade para os dados administráveis.



---



15. BANCO DE DADOS



Ainda NÃO crie um banco complexo sem necessidade.



Primeiro defina a arquitetura de dados necessária para o novo modelo.



Estruturas iniciais previstas:



- products;

- categories;

- brands;

- product_images;

- promotions;

- banners;

- services;

- store_settings;

- admin/users;

- favorites, caso a arquitetura escolhida exija persistência.



A estrutura deverá permitir crescimento futuro.



---



16. CONTEÚDO E DIVULGAÇÃO



O catálogo também será uma ferramenta de divulgação.



A arquitetura deverá permitir futuramente:



- banners;

- campanhas;

- produtos em destaque;

- promoções;

- categorias em destaque;

- novidades;

- serviços;

- conteúdos;

- chamadas comerciais;

- links para WhatsApp.



O objetivo é permitir que o proprietário utilize o catálogo diariamente para divulgar seus produtos.



---



17. REGRAS DE EXPERIÊNCIA



O usuário nunca deve ficar sem saber:



- onde está;

- o que pode fazer;

- qual produto está vendo;

- como voltar;

- como entrar em contato.



Todos os estados importantes devem possuir:



- loading;

- vazio;

- erro;

- sucesso;

- indisponibilidade.



Utilizar feedback visual adequado.



---



18. ESCALABILIDADE



A arquitetura deve permitir que futuramente o projeto receba:



- mais produtos;

- mais categorias;

- mais marcas;

- mais imagens;

- mais serviços;

- mais administradores;

- área do cliente;

- favoritos sincronizados;

- notificações;

- automações;

- integrações;

- recursos de IA;

- eventual evolução para outros modelos de negócio.



Não implementar essas funcionalidades agora.



Apenas não construir uma arquitetura que impeça sua evolução.



---



19. REGRAS DE DESENVOLVIMENTO



A partir deste projeto, siga estas regras:



REGRA 1



Não inventar informações da empresa.



REGRA 2



Quando uma informação não existir, utilizar estrutura preparada para receber posteriormente ou marcar como pendente.



REGRA 3



Não duplicar fonte de dados.



REGRA 4



Não criar funcionalidades desconectadas.



REGRA 5



Não criar e-commerce tradicional.



REGRA 6



WhatsApp é o principal canal comercial.



REGRA 7



O painel será responsável pelo conteúdo administrável.



REGRA 8



O público não possui acesso administrativo.



REGRA 9



Mobile-first.



REGRA 10



Performance é requisito funcional.



REGRA 11



SEO deve nascer junto com a arquitetura.



REGRA 12



Acessibilidade deve ser considerada desde o início.



REGRA 13



Componentes devem ser reutilizáveis.



REGRA 14



Evitar dependências desnecessárias.



REGRA 15



Não implementar funcionalidades futuras antes de sua etapa.



---



20. ORDEM OFICIAL DE CONSTRUÇÃO



Este projeto será construído em etapas.



ETAPA 00



Fundação e arquitetura.



ETAPA 01



Catálogo público.



ETAPA 02



Design System completo.



ETAPA 03



Produtos, categorias, marcas, busca e filtros.



ETAPA 04



Favoritos e compartilhamento.



ETAPA 05



WhatsApp e conversão.



ETAPA 06



Conteúdo e divulgação.



ETAPA 07



Painel administrativo.



ETAPA 08



Banco e integração completa do painel com catálogo.



ETAPA 09



SEO.



ETAPA 10



Performance.



ETAPA 11



Segurança.



ETAPA 12



Testes.



ETAPA 13



Revisão final.



ETAPA 14



Preparação para publicação.



Não pule etapas sem necessidade.



---



21. O QUE FAZER AGORA



Neste primeiro momento:



NÃO construa o projeto inteiro.



Primeiro:



1. Analise todas estas regras.

2. Analise a estrutura proposta.

3. Verifique se a arquitetura técnica escolhida é adequada.

4. Crie somente a fundação necessária para iniciar o projeto.

5. Configure a estrutura base do projeto.

6. Configure o Design System base com as cores definidas.

7. Configure a arquitetura de rotas.

8. Configure a base necessária para o catálogo.

9. Prepare a arquitetura para o futuro painel administrativo.

10. Não implemente ainda todos os módulos administrativos.

11. Não crie checkout.

12. Não crie gateway de pagamento.

13. Não crie venda direta.

14. Não invente produtos ou informações que não foram fornecidos.



---



22. CRITÉRIOS DE CONCLUSÃO DESTA ETAPA



Antes de considerar esta etapa concluída, confirme que:



- a estrutura do projeto está organizada;

- a arquitetura está definida;

- a identidade visual está configurada;

- as cores estão configuradas;

- a tipografia está configurada;

- a responsividade está preparada;

- a arquitetura pública está preparada;

- a arquitetura administrativa futura está preparada;

- o banco está preparado apenas no nível necessário;

- a segurança inicial está definida;

- SEO possui base inicial;

- performance foi considerada;

- não existe checkout tradicional;

- WhatsApp está definido como canal comercial;

- favoritos estão previstos;

- nenhuma informação fictícia foi criada.



Ao finalizar, NÃO avance automaticamente para a próxima etapa.



Entregue um resumo técnico:



ESTADO ATUAL



O que foi criado.



ARQUITETURA



Como o projeto foi organizado.



DECISÕES



Quais decisões foram tomadas.



PENDÊNCIAS



O que ainda precisa ser definido.



PRÓXIMA ETAPA



Qual será a próxima etapa recomendada.



Não implemente a próxima etapa automaticamente.



Aguarde o próximo comando.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://vira-lata-catalogo-connect.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0acfb9f6-23c8-4d05-9cd4-367b21ddaafa).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
