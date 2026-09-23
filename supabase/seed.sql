-- Seed for local development. Loaded by `supabase db reset` through
-- config.toml [db.seed] sql_paths = ["./seed.sql", "./seed/*.sql"].
--
-- Fixed UUIDs so the README, curl examples and the other branches can
-- reference rows by hand. Convention: 00000000-0000-0000-0000-0000000000NN
--   ...0001-0003  brands
--   ...0011-0012  team leads
--   ...0021-0023  specialists
--   ...0101-0303  replies (1xx voltaire, 2xx kraftco, 3xx lume)
--   ...0001NNN    the review of reply NNN
--
-- Every sent_at is relative to now(), never an absolute date, so the queue
-- still reads "yesterday" whenever this is reset.

-- ---------------------------------------------------------------- brands
insert into brands (id, name, slug, voice_guidelines) values
('00000000-0000-0000-0000-000000000001','Voltaire','voltaire',
 $$Voltaire sells electric scooters. Tone: calm, technical, confident.
Procedures:
1. Diagnose before you offer anything. Ask for the error code on the display and the mileage.
2. Check order history for prior claims before approving any RMA or refund.
3. Never approve a refund in the first reply.
4. Link the relevant help article by name.$$),
('00000000-0000-0000-0000-000000000002','Kraft&Co','kraftco',
 $$Kraft&Co sells packaging supplies to businesses. Tone: fast, exact, no small talk. Three lines max.
Procedures:
1. Confirm SKU and quantity back to the customer.
2. Quote lead time only from the lead-time table. Never promise a date not in the table.
3. Mention the pallet minimum whenever quantity is within 20% of it.$$),
('00000000-0000-0000-0000-000000000003','Lume','lume',
 $$Lume sells skincare. Tone: warm, reassuring, plain language. No medical claims.
Procedures:
1. Never say a product treats or cures anything.
2. Patch-test advice on every reaction complaint.
3. Offer replacement before refund.$$)
on conflict (id) do nothing;

-- ---------------------------------------------------------------- people
insert into profiles (id, full_name, email, role) values
('00000000-0000-0000-0000-000000000011','Marta Ruiz','marta@sellervate.test','team_lead'),
('00000000-0000-0000-0000-000000000012','Nuria Vega','nuria@sellervate.test','team_lead'),
('00000000-0000-0000-0000-000000000021','Dani Ortega','dani@sellervate.test','specialist'),
('00000000-0000-0000-0000-000000000022','Iker Sanz','iker@sellervate.test','specialist'),
('00000000-0000-0000-0000-000000000023','Leo Marín','leo@sellervate.test','specialist')
on conflict (id) do nothing;

-- ------------------------------------------------------------ membership
-- Cross-assigned on purpose: this is what makes isolation testable.
-- Marta leads Voltaire + Kraft&Co but NOT Lume, so a lead who is not a member
-- of a brand does not see it either. Dani works Voltaire + Kraft&Co, so the
-- same specialist appears under two different voices.
insert into brand_members (brand_id, user_id, role) values
('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','team_lead'),
('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000011','team_lead'),
('00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000012','team_lead'),
('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000021','specialist'),
('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000021','specialist'),
('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000022','specialist'),
('00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000022','specialist'),
('00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000023','specialist')
on conflict do nothing;
