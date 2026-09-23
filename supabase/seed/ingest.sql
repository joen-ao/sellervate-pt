-- P4 · ingestion sources. Loaded after seed.sql by [db.seed] sql_paths.
-- Fixed ids (…06NN) so the README and curl examples can name them:
--   …0601-0603  one csv source per brand (UI upload only, no token)
--   …0611       Voltaire's Gorgias source, bearer "voltaire-dev-token"
-- LOCAL-ONLY token. Only its sha256 is stored, never the token itself.
insert into ingest_sources (id, brand_id, kind, name, config, token_hash) values
('00000000-0000-0000-0000-000000000601','00000000-0000-0000-0000-000000000001',
 'csv','Voltaire CSV upload','{}', null),
('00000000-0000-0000-0000-000000000602','00000000-0000-0000-0000-000000000002',
 'csv','Kraft&Co CSV upload','{}', null),
('00000000-0000-0000-0000-000000000603','00000000-0000-0000-0000-000000000003',
 'csv','Lume CSV upload','{}', null),
('00000000-0000-0000-0000-000000000611','00000000-0000-0000-0000-000000000001',
 'gorgias','Voltaire Gorgias','{"subdomain":"voltaire-dev"}',
 encode(sha256(convert_to('voltaire-dev-token', 'UTF8')), 'hex'))
on conflict (id) do nothing;
