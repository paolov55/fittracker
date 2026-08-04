# Edge functions

Nenhuma função é estritamente necessária para o MVP — a maior parte das
regras de negócio de `db_instructions.md` (verificação de CREF, convites por
código, agendamento de programa) é resolvida com RLS + queries diretas do
cliente Supabase. Use uma edge function quando precisar de lógica que não
pode rodar com as policies existentes (`security definer`), por exemplo:

- **`accept-invite`**: aceitar convite de aluno validando o código e
  atualizando `trainer_students` de forma atômica.
- **`verify-cref`**: consultar um serviço externo (CFEF/CREFs regionais) e
  atualizar `trainer_details.verification_status`.

Convenção: uma pasta por função (`supabase/functions/<nome>/index.ts`),
runtime Deno, importando `../_shared/cors.ts` para CORS. Deploy com
`supabase functions deploy <nome>`.
