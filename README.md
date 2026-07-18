# Manager FC

Organizador de modo carreira com login Google, sincronização entre dispositivos e histórico por usuário.

## Arquitetura

- **Vercel:** publica os arquivos estáticos da pasta `dist/`.
- **Supabase Auth:** realiza o login Google por OAuth com PKCE.
- **Supabase PostgreSQL:** mantém uma única linha de estado por usuário.
- **RLS:** permite que cada usuário leia somente a própria carreira.
- **Edge Function:** exclui a conta autenticada e aciona a exclusão em cascata da carreira.
- **Navegador:** mantém apenas a sessão necessária e um cache da carreira enquanto o usuário está conectado.

Não existe tabela de perfil. Nome, foto, telefone e outros dados pessoais não são copiados para o banco da aplicação. A tabela `career_states` contém somente o UUID técnico do Supabase, o JSON da carreira, uma versão e a data da última sincronização.

## Recursos da carreira

- Elenco, base, mercado, táticas, calendário, estatísticas e histórico por temporada.
- Negociações de compra, venda e empréstimo com atualização do livro-caixa.
- Relatórios de partida com escalação, substituições e atualização automática de estatísticas.
- Linha do tempo do calendário, caixa de notificações e eventos narrativos.
- Competições personalizadas, filtros por faixa e seleção/exclusão em lote.
- Backup e restauração em JSON, importação/exportação CSV e compressão de imagens.

## Controles de privacidade implementados

- Nenhum analytics, anúncio ou cookie de marketing.
- Nenhum acesso a Drive, contatos, agenda ou APIs Google.
- Nenhum armazenamento de token Google para chamadas em nome do usuário.
- Cache de carreira separado por usuário e removido no logout.
- Backup JSON para acesso e portabilidade.
- Exclusão de conta e carreira pela própria interface.
- Restrição declarada para pessoas com 18 anos ou mais.
- Aviso de privacidade público em `privacidade.html`.
- Limite de 10 MB por estado de carreira para reduzir abuso e retenção excessiva.

O Supabase Auth recebe os metadados básicos exigidos pelo fluxo Google (`openid`, e-mail e perfil). O Manager FC não duplica nem utiliza nome ou foto, mas esses metadados podem existir internamente no serviço de autenticação do Supabase.

## Configuração

Siga [CONFIGURACAO-SUPABASE.md](CONFIGURACAO-SUPABASE.md). A publicação na Vercel é bloqueada quando faltam URL/chave pública do Supabase ou a identificação e o contato do controlador.

Nunca envie `SUPABASE_SERVICE_ROLE_KEY` para o navegador ou para variáveis usadas no frontend. Essa chave fica exclusivamente no ambiente protegido da Edge Function.

## Desenvolvimento

Copie `.env.example` para `.env.local`, preencha os valores e execute:

```powershell
npm install
npm run dev
```

O endereço local padrão é `http://127.0.0.1:4173`.

Comandos úteis:

```powershell
npm run seed   # recria os dados iniciais a partir dos CSVs
npm run build  # gera a publicação em dist/
npm run check  # verifica interface, autenticação, privacidade e RLS
```

## Estrutura principal

- `index.html`: interface e tela de login.
- `privacidade.html`: aviso de privacidade com dados do controlador preenchidos no build.
- `src/auth.js`: login Google, sincronização, logout e exclusão.
- `assets/js/`: regras da carreira separadas por elenco, calendário, transferências, estatísticas, táticas e renderização.
- `assets/app.css`, `assets/cloud.css` e `assets/responsive.css`: interface principal, autenticação e adaptação para telas menores.
- `supabase/migrations/`: tabela mínima, RLS e função de salvamento.
- `supabase/functions/delete-account/`: exclusão autenticada da conta.
- `scripts/build.mjs`: build estático e injeção apenas das configurações públicas.
- `data/`: elenco, base e mercado iniciais.
- `legacy/`: protótipo original preservado.

## Observação jurídica

A implementação aplica minimização, transparência e exclusão, mas tecnologia sozinha não garante conformidade integral com a LGPD. Antes da publicação, o controlador deve validar o aviso, as bases legais, os contratos com Google/Supabase/Vercel, o atendimento aos titulares e o tratamento de eventuais incidentes com orientação jurídica adequada.
