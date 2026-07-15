# Configuração do Supabase e Google

Esta etapa depende das contas do responsável pelo projeto. Nenhum segredo deve ser enviado ao repositório.

## 1. Criar o projeto Supabase

Crie um projeto em [supabase.com](https://supabase.com/) e anote:

- `Project URL`, usada como `SUPABASE_URL`;
- `Publishable key`, usada como `SUPABASE_PUBLISHABLE_KEY`.

A publishable key é pública e foi projetada para o navegador. Não use a `service_role` no frontend.

## 2. Criar a estrutura do banco

No SQL Editor do Supabase, execute o conteúdo de:

`supabase/migrations/202607150001_initial.sql`

Essa migração cria somente `career_states`, ativa RLS e libera a leitura apenas quando `auth.uid()` corresponde ao `user_id`. O salvamento ocorre pela função `save_my_career`, que sempre usa o UUID da sessão autenticada.

## 3. Configurar o Google OAuth

Siga a [documentação oficial do login Google no Supabase](https://supabase.com/docs/guides/auth/social-login/auth-google):

1. Crie ou selecione um projeto no Google Auth Platform.
2. Configure a audiência e o branding do aplicativo.
3. Mantenha somente os escopos padrão exigidos pelo Supabase: `openid`, `userinfo.email` e `userinfo.profile`.
4. Crie um OAuth Client do tipo **Web application**.
5. Em **Authorized JavaScript origins**, adicione o domínio de produção da Vercel e `http://127.0.0.1:4173` para desenvolvimento.
6. Em **Authorized redirect URIs**, adicione exatamente a Callback URL exibida na página do provedor Google no Supabase. Normalmente: `https://SEU-PROJETO.supabase.co/auth/v1/callback`.
7. Copie o Client ID e o Client Secret para **Authentication → Providers → Google** no Supabase e ative o provedor.

Não adicione escopos para Drive, contatos, agenda ou acesso offline.

## 4. Configurar os redirecionamentos

Em **Authentication → URL Configuration** no Supabase:

- `Site URL`: URL final da Vercel, com `https://` (nunca localhost em produção);
- `Redirect URLs`: a mesma URL final exata, `http://127.0.0.1:4173/**` para desenvolvimento e apenas os previews que realmente forem utilizados.

O app usa como `redirectTo` a própria URL em que foi aberto, e ela precisa estar nessa lista. Quando não há correspondência, o Supabase ignora o retorno solicitado e usa a `Site URL`; se ela ainda estiver como localhost, o login termina no endereço local. Consulte a [documentação oficial de Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).

## 5. Publicar a função de exclusão

Com a Supabase CLI autenticada e vinculada ao projeto:

```powershell
supabase functions deploy delete-account
supabase secrets set ALLOWED_ORIGINS=https://SEU-PROJETO.vercel.app
```

Para permitir mais de uma origem, separe-as por vírgula. Evite curingas em produção.

O Supabase fornece `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` ao ambiente protegido da função. A função valida o JWT e a origem antes de apagar o usuário. A exclusão do usuário remove `career_states` por `ON DELETE CASCADE`.

## 6. Configurar a Vercel

Cadastre as seguintes variáveis no projeto:

```text
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
DATA_CONTROLLER_NAME=Nome da pessoa ou empresa responsável
PRIVACY_CONTACT_EMAIL=privacidade@seudominio.com.br
```

Não cadastre `SUPABASE_SERVICE_ROLE_KEY` na Vercel.

Depois, publique novamente. O `vercel.json` executará `npm run build` e entregará `dist/`.

## 7. Checklist antes de abrir ao público

- Testar login, logout e retorno do Google no domínio final.
- Confirmar que duas contas não enxergam os mesmos dados.
- Testar sincronização em dois navegadores.
- Baixar e restaurar um backup.
- Excluir uma conta de teste e confirmar a remoção em Auth e `career_states`.
- Trocar os dados provisórios do controlador e usar um e-mail monitorado.
- Revisar o Aviso de Privacidade e os contratos dos operadores.
- Definir um procedimento para solicitações de titulares e incidentes.

O Supabase exige `service_role` para apagar usuários e determina que essa operação seja executada somente no servidor. Veja a [referência oficial](https://supabase.com/docs/reference/javascript/auth-admin-deleteuser).
