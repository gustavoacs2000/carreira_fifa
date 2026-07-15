-- Manager FC: estado mínimo por usuário.
-- Não existe tabela de perfil e nenhum nome, foto ou e-mail é duplicado aqui.

create table if not exists public.career_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null check (jsonb_typeof(state) = 'object'),
  version bigint not null default 1 check (version > 0),
  updated_at timestamptz not null default now()
);

alter table public.career_states enable row level security;

revoke all on table public.career_states from anon, authenticated;
grant select on table public.career_states to authenticated;

drop policy if exists "users_read_only_their_career" on public.career_states;
create policy "users_read_only_their_career"
on public.career_states
for select
to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.save_my_career(p_state jsonb)
returns bigint
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  saved_version bigint;
  caller_id uuid := auth.uid();
begin
  if caller_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if p_state is null or jsonb_typeof(p_state) <> 'object' then
    raise exception 'invalid career state' using errcode = '22023';
  end if;

  if pg_column_size(p_state) > 10485760 then
    raise exception 'career state exceeds 10 MB' using errcode = '54000';
  end if;

  insert into public.career_states (user_id, state)
  values (caller_id, p_state)
  on conflict (user_id) do update
    set state = excluded.state,
        version = public.career_states.version + 1,
        updated_at = now()
  returning version into saved_version;

  return saved_version;
end;
$$;

revoke all on function public.save_my_career(jsonb) from public, anon;
grant execute on function public.save_my_career(jsonb) to authenticated;

comment on table public.career_states is
  'Estado da carreira associado somente ao UUID técnico do usuário autenticado.';
comment on column public.career_states.updated_at is
  'Data técnica da última sincronização; usada para operação e resolução de suporte.';
