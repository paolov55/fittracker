-- ============================================================================
-- Fix: handle_new_user() falhava no signup com
--   "relation \"profiles\" does not exist"
--   "current transaction is aborted, commands ignored until end of transaction block"
--
-- Causa: a função é security definer mas não fixava search_path. Durante o
-- insert em auth.users (disparado pelo GoTrue), o search_path efetivo pode
-- não incluir "public", então "insert into profiles" não resolve o nome da
-- tabela, a transação aborta e o Supabase Auth devolve 500 no signup.
--
-- Rode este arquivo inteiro no SQL Editor do projeto Supabase já em produção.
-- É idempotente (create or replace) — não precisa reaplicar schema.sql.
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  code text;
begin
  -- invite_code é unique; gerar com retry evita falha intermitente em colisão
  loop
    code := lpad((floor(random() * 1000000))::text, 6, '0');
    exit when not exists (select 1 from public.profiles p where p.invite_code = code);
  end loop;

  insert into public.profiles (id, role, full_name, email, invite_code)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'student'),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    code
  );
  return new;
end;
$$;

-- O trigger já aponta para handle_new_user(); create or replace acima basta,
-- mas recriamos para garantir que ele existe e está ativo.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Verificação: deve retornar {search_path=public} na coluna proconfig.
select proconfig from pg_proc where proname = 'handle_new_user';
