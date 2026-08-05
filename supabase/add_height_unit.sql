-- ============================================================================
-- Adiciona student_details.height_unit ('cm' | 'ft'), espelhando weight_unit:
-- é só preferência de exibição, height_cm continua sempre a fonte da verdade
-- em centímetros. Necessário porque o onboarding passou a deixar o usuário
-- escolher a unidade de altura.
--
-- Rode este arquivo inteiro no SQL Editor do projeto Supabase já em produção.
-- É idempotente — não precisa reaplicar schema.sql.
-- ============================================================================

alter table student_details
  add column if not exists height_unit text not null default 'cm'
    check (height_unit in ('cm', 'ft'));
