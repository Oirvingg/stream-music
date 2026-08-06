-- Limpeza de dados de teste de usuários (Stream Music / Neon PostgreSQL).
--
-- O QUE FAZ:
--   Esvazia os dados de usuário (contas, playlists, favoritos) mantendo:
--     - a estrutura das tabelas intacta (nenhum DROP/ALTER é executado);
--     - a tabela `categories` intacta (é catálogo de mood/gênero da UI,
--       não dado de usuário/teste);
--     - a role de acesso da aplicação (`neondb_owner`) intocada — este
--       script só manipula dados (DML), nunca permissões/roles.
--
-- POR QUE UM TRUNCATE SÓ, COM CASCADE:
--   `playlists.user_id` e `favorites.user_id` referenciam `users(id)` com
--   ON DELETE CASCADE (ver scripts/schema.sql). Truncar `users` sozinho sem
--   CASCADE falharia com erro de FK; listar as 3 tabelas + CASCADE garante
--   que tudo é esvaziado atomicamente, sem deixar linha órfã em playlists
--   ou favorites.
--
-- RESTART IDENTITY:
--   Zera os contadores SERIAL (users.id, playlists.id) para que a próxima
--   conta de teste criada comece do id 1 de novo, em vez de continuar de
--   onde os dados removidos pararam.
--
-- ATENÇÃO — LEIA ANTES DE RODAR:
--   TRUNCATE é irreversível (não há "desfazer"). Este projeto não tem uma
--   DATABASE_URL de desenvolvimento separada da de produção — o mesmo Neon
--   configurado em .env / no Render é usado pela aplicação publicada.
--   Confirme que está apontando para o banco certo ANTES de executar:
--
--     SELECT current_database(), inet_server_addr();
--
--   Se a resposta não for claramente o banco de teste que você espera que
--   seja, PARE e não rode o TRUNCATE abaixo.
--
-- COMO RODAR (fora deste script, manualmente, depois de confirmar o banco):
--   psql "$DATABASE_URL" -f scripts/cleanup-test-users.sql

BEGIN;

TRUNCATE TABLE favorites, playlists, users
  RESTART IDENTITY CASCADE;

COMMIT;
