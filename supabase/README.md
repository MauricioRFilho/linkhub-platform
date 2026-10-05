# Banco de dados

A migration inicial é `migrations/20261002120000_initial_schema.sql`.
Cria seis tabelas, índices, RLS, permissões, nomes reservados e o bucket
público `avatars` (até 2 MB). Inserir um perfil cria tema e metadados
na mesma transação. Apenas acesso administrativo pode alterar `verified`.
`20261002130000_add_editorial_theme.sql` acrescenta Editorial ao conjunto,
totalizando cinco templates entre os modos claro e escuro.

## Estado do projeto remoto

Em 02/10/2026, as migrations `20261002120000` e `20261002130000` foram
aplicadas ao projeto `dnzmcgeuhblxrlpvbcmz` pela API administrativa. O schema
e os registros em `supabase_migrations.schema_migrations` foram confirmados.
As seis tabelas responderam HTTP 200 pela Data API; RLS, triggers e bucket
de avatares foram confirmados no banco remoto. Nesta rodada, o navegador
validou o formulário e o redirecionamento de rotas protegidas; não foi enviado
um novo Magic Link nem iniciado OAuth.

A CLI 2.119.0 apresentou erro de permissão ao configurar
`cli_login_postgres` no fluxo de `db push`. Para próximas migrations pela
conexão PostgreSQL, use a senha válida do banco via `SUPABASE_DB_PASSWORD`
no terminal local. Não é necessário repetir o login da conta.

## Aplicar no projeto remoto

Autentique a CLI localmente. A chave publishable usada pelo app não permite DDL.

```powershell
npx supabase login
npx supabase link --project-ref dnzmcgeuhblxrlpvbcmz
npx supabase db push --dry-run
npx supabase db push
npx supabase migration list
```

O vínculo pode solicitar a senha do banco. Não coloque tokens ou senhas no Git.
O comando `db push` registra a migration no histórico; não execute
`db reset --linked` no projeto remoto.

## Validar isoladamente

Com Docker em execução, `npm test` roda os testes unitários e o teste SQL. Para
executar apenas o teste isolado do banco:

```powershell
npm run test:db
```

O teste usa PostgreSQL 17 em um container temporário, sem portas expostas.
A fixture reproduz os schemas e papéis usados pelo SQL; não valida serviços
HTTP de Auth/Storage nem login real. O container é removido ao terminar.

O `seed.sql` é um exemplo manual comentado. Só execute após criar um usuário
real no Supabase Auth e substituir seu UUID.
