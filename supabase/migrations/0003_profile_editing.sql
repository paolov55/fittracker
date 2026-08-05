-- ============================================================================
-- Extensões do app para edição de perfil: unidade de carga preferida e
-- upload de foto de perfil (Supabase Storage). Segue a mesma convenção de
-- 0002_app_extensions.sql — colunas/infra novas, sem alterar policies
-- existentes de forma incompatível.
-- ============================================================================

-- Unidade de carga usada na EXIBIÇÃO (kg ou lb). Toda persistência de peso
-- continua em kg — esta coluna é só preferência de apresentação, para não
-- corromper séries/histórico já gravados em kg.
alter table student_details
  add column weight_unit text not null default 'kg' check (weight_unit in ('kg', 'lb'));

-- Bucket público para fotos de perfil. Público em leitura (as fotos aparecem
-- em telas de aluno/personal), mas cada usuário só escreve na própria pasta
-- ({user_id}/...), garantido pelas policies abaixo.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_owner_update"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
