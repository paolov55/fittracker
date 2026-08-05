# Fittracker — Guia do banco de dados (para agentes de IA)

Este documento explica `schema.sql` para quem for implementar a API/backend do Fittracker sobre Supabase. Leia antes de escrever queries ou migrations novas.

## Visão geral

O banco tem 5 domínios:

1. **Identidade & acesso** — `profiles`, `student_details`, `trainer_details`
2. **Vínculo & atribuição** — `trainer_students`, `program_assignments`
3. **Biblioteca** — `exercises`, `programs`, `workouts`, `workout_exercises`
4. **Execução** — `sessions`, `session_sets`
5. **Progresso** — `body_metrics`

`profiles.id` é sempre o mesmo UUID de `auth.users.id` (1:1, PK = FK). Um trigger (`handle_new_user`) cria a linha em `profiles` automaticamente no signup, lendo `role` e `full_name` de `raw_user_meta_data` — passe esses campos nas options do `supabase.auth.signUp()`.

`student_details` e `trainer_details` são extensões 1:1 de `profiles`, split por papel (só existe a linha correspondente ao `role` do usuário). Nunca duplique colunas de `profiles` nelas.

## Regras de negócio importantes

**CREF e liberação do personal.** `trainer_details.verification_status` começa `pending`. Enquanto não for `verified`, o personal não deve conseguir criar/editar programas para alunos — trate isso na camada de API (a RLS não bloqueia por si só; adicione um `check` na camada de aplicação ou uma policy adicional em `programs`/`program_assignments` se quiser reforçar no banco).

**Convites por código.** `profiles.invite_code` (6 dígitos, único) serve tanto para aluno quanto para personal. O fluxo "adicionar aluno" do personal busca por esse código e cria uma linha em `trainer_students` com `status='pending'`; vira `active` quando o aluno aceita.

**Programas: síncrono vs. assíncrono.** `programs.mode` decide como `workouts` é ordenado:
- `sync`: usa `workouts.day_key` (seg…dom); dias sem `workout` são descanso.
- `async`: usa `workouts.sequence_order`; o app avança a fila a cada treino concluído.
O `check` em `workouts` garante que pelo menos um dos dois esteja preenchido.

**Escopo de configuração (séries/reps/descanso).** `programs.sets_by` e `programs.rest_by` (`program` | `workout` | `exercise`) dizem em que nível o valor é definido:
- Os defaults ficam em `programs.default_sets/rep_min/rep_max/rest_seconds`.
- `workouts.rest_seconds` sobrescreve quando `rest_by = 'workout'`.
- `workout_exercises.rep_min/rep_max/target_kg` sobrescreve quando o escopo é `exercise`.
Ordem de precedência ao ler um exercício: `workout_exercises` (se preenchido) → `workouts` (se aplicável) → `programs` default.

**Comunidade vs. programas privados.** `programs.visibility='community'` + `published_at` não nulo = aparece no marketplace da comunidade. Programas privados (`visibility='private'`) só aparecem para o dono e para quem tem uma `program_assignments` ativa.

**Agendamento de programa (personal → aluno).** `program_assignments.live_at` é a data/hora em que o programa passa a ser visível para o aluno. `status`:
- `scheduled`: `live_at` no futuro — aluno ainda não vê.
- `live`: visível agora (a policy de leitura já filtra por `live_at <= now()`, então `status` é principalmente informativo para a UI do personal — mantenha os dois sincronizados).
- `archived`: histórico, não é mais o programa ativo do aluno.
Ao criar um novo programa "para" um aluno pela tela de gerenciamento, sempre crie a linha em `program_assignments` com `assigned_by = <personal>`.

**Execução de treino.** Uma `session` é aberta ao iniciar um treino (`status='active'`), populada com `session_sets` (uma linha por série concluída/pendente) e fechada com `status='completed'` (ou `'discarded'` se o usuário sair sem salvar). `total_volume_kg` e `duration_seconds` são calculados no fechamento a partir de `session_sets` e `started_at`/`ended_at`.

**Progresso e telas derivadas.**
- Calendário semanal da home: junte `workouts.day_key` do programa ativo com `sessions` concluídas na semana corrente (por `student_id` + `started_at`).
- Histórico do aluno (tela do personal): `sessions` do aluno, ordenado por `started_at desc`, com agregados de `session_sets`.
- Gráficos de peso corporal: série temporal de `body_metrics` por `student_id`.

**Unidade de carga (`student_details.weight_unit`).** É só preferência de exibição (`kg` ou `lb`) — todo peso é sempre persistido em kg em `body_metrics`, `session_sets.kg_done`, `workout_exercises.target_kg` etc. Converta apenas na camada de apresentação; nunca grave um valor já convertido para lb no banco.

**Unidade de altura (`student_details.height_unit`).** Mesma lógica: preferência de exibição (`cm` ou `ft`), `height_cm` continua sempre a fonte da verdade em centímetros. Converta apenas na camada de apresentação.

**Foto de perfil.** `profiles.avatar_url` é uma URL pública do bucket `avatars` (Supabase Storage). Cada usuário só pode escrever no próprio caminho, `{user_id}/...` — as policies de storage bloqueiam gravação fora dessa pasta. Ao trocar a foto, grave em um path estável (ex: `{user_id}/avatar.<ext>`) e use `upsert: true` para sobrescrever; acrescente um cache-busting query param (`?v=timestamp`) na URL salva em `avatar_url` para a UI não servir a versão antiga do CDN.

## Row Level Security

RLS está habilitada em todas as tabelas. Padrão geral: dono (`auth.uid()`) tem acesso total ao próprio dado; o personal vinculado (`trainer_students.status='active'`) tem **leitura** de `profiles`, `student_details`, `sessions`, `session_sets` e `body_metrics` do aluno, para as telas de gerenciamento/progresso — mas não escreve nesses dados diretamente (ele escreve em `programs`/`workouts`/`workout_exercises` que possui, e em `program_assignments`/`trainer_students` que criou).

Exercícios do catálogo padrão (`exercises.created_by is null`) são legíveis por todos; exercícios custom só pelo autor edita, mas a leitura de `exercises` é pública (necessário para montar treinos vendo o catálogo inteiro).

Ao adicionar uma tela nova, primeiro confira se a policy existente já cobre o acesso necessário antes de criar uma nova — a maioria dos casos de leitura já está coberta pelos padrões "dono" e "personal vinculado".

## Convenções

- Todas as PKs são `uuid default gen_random_uuid()` (exceto `profiles.id`, que espelha `auth.users.id`).
- Timestamps em `timestamptz`; datas puras (ex: peso do dia) em `date`.
- Enums em vez de `text` livre sempre que o valor é um conjunto fechado — não adicione novos valores sem migration.
- Nomes de tabela e coluna em `snake_case`, inglês; conteúdo de dados (nomes de treino, exercícios) fica em português como o app.
