# P4 · Ingesta desde helpdesk
Rama `feat/ingestion` · Migración `0006_ingest.sql` · Est. 90 min · Depende de 01

## 1. Producto
"Eventualmente esto debería sacar las respuestas del helpdesk solo. No ahora. Solo no lo hagas imposible después." V1 dejó `source`/`external_id`/`channel` y `unique(source, external_id)`. Esto atraviesa la puerta.

- `ingest_sources` por marca: tipo `csv | gorgias | zendesk`, config no secreta, token bearer hasheado.
- `POST /api/ingest/[sourceId]` con payload normalizado; upsert por `(source, external_id)`; email de specialist desconocido → `replies_unmatched`, nunca se descarta.
- Un adaptador real: **carga de CSV** en `/brands/[slug]/import` (lead). Gorgias/Zendesk son mapeos documentados, no código.
- Identidad de máquina: bearer por fuente, no cookie de usuario. Primer principal no humano de la app — un párrafo en DECISIONS.
- El payload nunca escribe en otra marca: `brand_id` sale de la fila de la fuente.
- Fuera: OAuth, polling, sync bidireccional, adjuntos.

## 2. Plan técnico
- **Migración** (código en `P4-helpdesk-ingestion.md`): `ingest_sources`, `replies_unmatched` (unique por `source_id, external_id`), `replies.ingested_at`, RLS en ambas tablas (leads miembros).
- **Validación** `lib/validation/ingest.ts`: `IngestItem` zod (external_id, email, textos con máximos, `sent_at` datetime, channel) y `IngestBatch` 1–500.
- **DAL** `ingestBatch(sourceId, items, principal)`: carga la fuente; si el principal es usuario, `requireRole('team_lead')` + `assertBrandMember`; resuelve emails → ids en una query; separa ok/unmatched; `upsert` con `ignoreDuplicates` en ambas tablas; actualiza `last_synced_at`. La membresía del specialist en la marca **no** se exige aquí a propósito (un helpdesk puede mostrar una reply de alguien que aún no está en `brand_members`); la fila cae, el lead la ve, y el hueco es visible. Anotarlo.
- **Ruta** `app/api/ingest/[sourceId]`: bearer → sha256 → comparación en tiempo constante con `token_hash`; rechaza fuentes `csv`; responde `{inserted, unmatched}`.
- **Import CSV**: `<input type=file>` → `papaparse` en servidor (import dinámico) → mapeo de columnas → `IngestBatch.parse` → `ingestBatch`. Página de resultado con conteos y emails no encontrados. Muestra en `docs/import-sample.csv`.
- **Seed** `seed/ingest.sql`: una fuente csv por marca; una gorgias para Voltaire con `token_hash = sha256('voltaire-dev-token')`, documentado en README.

## 3. Verificar a mano
- `POST /api/ingest/$VOLTAIRE_SRC` con bearer correcto y `docs/ingest-sample.json` → `{"inserted":3,"unmatched":1}`; repetir → `{0,0}`.
- Mismo token contra `$KRAFT_SRC` → 403.
- UI: importar el CSV dos veces para Kraft&Co como Marta → 10 y luego 0 nuevas; como Nuria → 403.

## 4. Checklist de review
- ¿`brand_id` viene de la fila de la fuente, nunca del payload?
- ¿Token comparado en tiempo constante; se guarda el hash, no el token?
- ¿Upsert idempotente (`ignoreDuplicates`)?
- ¿`papaparse` solo en servidor?
- ¿Las tablas nuevas tienen RLS?
