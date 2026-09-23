# 01 · Modelo de datos y seed
Rama `feat/schema-seed` · Migración `0001_schema.sql` · Est. 45–60 min · Oleada 0

## 1. Producto
Entidades y relaciones que sobrevivan el crecimiento, más seed que haga usable la herramienta desde el primer arranque.

- **brands** — el cliente. `voice_guidelines` es el texto contra el que juzga el lead.
- **profiles** — personas. `role` es su rol por defecto; el rol por marca vive en la membresía.
- **brand_members** — many-to-many; quién cubre qué marca y como qué.
- **replies** — una respuesta que ya salió. Solo lectura en V1. Lleva `source`/`external_id`/`channel` para la ingesta futura.
- **reviews** — el juicio de un lead sobre una reply. Inmutable en V1.

Decisiones a defender:
- **Score (1–5) + severidad + categorías[]**, no rubric ponderado. Crece a `review_scores(review_id, criterion, value)` después sin romper nada.
- **`severity` independiente de `score`.** Un 4/5 puede tener un error factual crítico; las tendencias tratan cualquier `critical` como evento rojo.
- **`unique (reply_id, reviewer_id)`** — dos leads pueden revisar la misma reply (P1) sin migración.
- **`unique (source, external_id)`** — la ingesta (P4) es idempotente desde el día uno.
- **Sin `brand_id` en reviews** — se deriva vía `replies`.
- **Reviews inmutables** — sin update; auditoría sería `review_events` si algún día hace falta.
- **Check `critical_needs_category`** en la base: si es crítico tiene que decir de qué tipo. El form da el mensaje amable; la base es el respaldo.

## 2. Plan técnico

### Archivos
```
supabase/config.toml                 # [db.seed] sql_paths = ["./seed.sql", "./seed/*.sql"]
supabase/migrations/0001_schema.sql
supabase/seed.sql
supabase/seed/.gitkeep
lib/database.types.ts                # npm run db:types
lib/types.ts                         # uniones que espejan los enums + alias de filas + CATEGORY_LABEL
package.json: db:reset, db:types, typecheck, lint
```

### Migración y `lib/types.ts`
SQL y TS idénticos a `01-data-model-and-seed.md`. Puntos que no se negocian: enums con guarda idempotente, índices compuestos `(brand_id, sent_at desc)` y `(specialist_id, sent_at desc)` en replies, `(reviewer_id, created_at desc)` en reviews, la vista `reply_with_review` como atajo de lectura (sin semántica de seguridad; el DAL filtra).

### Seed
UUIDs fijos con convención `00000000-0000-0000-0000-0000000000NN` para poder referenciarlos en README y curl.

**Marcas**
- `voltaire` — scooters eléctricos. Voz calmada, técnica. Procedimientos: diagnosticar antes de ofrecer nada (pedir código de error y kilometraje); revisar historial de pedidos antes de aprobar RMA o reembolso; nunca aprobar reembolso en la primera respuesta; enlazar el artículo de ayuda por nombre.
- `kraftco` — insumos de packaging B2B. Voz rápida, exacta, sin charla, tres líneas máximo. Procedimientos: confirmar SKU y cantidad; cotizar lead time solo de la tabla; mencionar el mínimo por pallet cuando la cantidad esté a menos del 20 %.
- `lume` — skincare. Voz cálida, sin claims médicos. Procedimientos: nunca decir que un producto trata o cura; consejo de patch-test ante reacciones; reemplazo antes que reembolso.

**Personas y membresía** (cruzada a propósito: es lo que hace testeable el aislamiento)
| Persona | Rol | Marcas |
|---|---|---|
| Marta Ruiz | team_lead | voltaire, kraftco |
| Nuria Vega | team_lead | lume |
| Dani Ortega | specialist | voltaire, kraftco |
| Iker Sanz | specialist | kraftco, lume |
| Leo Marín | specialist | lume |

**Replies** — `sent_at` relativo a `now()` para que la cola siempre muestre "ayer". 20 replies, 13 revisadas, 7 sin revisar. Filas obligatorias (tabla completa con ids en el spec en inglés):
- 101 Voltaire/Dani — **la obviamente mala**: aprueba reembolso ante un "no carga" sin pedir código de error, y el cliente ya había tenido un reemplazo → 1 / critical / {no_order_history_check, wrong_facts}.
- 102 Voltaire/Dani — diagnóstico de manual: pide código E-07 y km, enlaza artículo → 5. Con `acknowledged_at` seteado para que `/me` muestre ambos estados.
- 104 Voltaire/Dani — el cliente pregunta por autonomía, la respuesta habla de carga → 2 / minor / {answered_wrong_question}.
- 201 Kraft&Co/Iker — **correcta pero el cliente vuelve**: lead time exacto, sin mencionar el mínimo por pallet → 3 / none / {incomplete}.
- 202 Kraft&Co/Dani — **voz equivocada**: cinco párrafos cálidos para una pregunta de SKU → 2 / minor / {tone_off_brand}.
- 205 Kraft&Co/Dani — Dani clava la voz de Kraft&Co → 5. Muestra "misma persona, trabajo distinto".
- 206 Kraft&Co/Iker — prometió una fecha que no está en la tabla → 1 / critical / {wrong_facts}.
- 107–109, 207–208, 302–303 — sin revisar, para la cola. Lume queda escaso a propósito para que Nuria vea los estados vacíos.

Regla de calidad de texto: cada reply tiene 2–8 frases, menciona un detalle concreto (modelo, SKU, título de artículo) y se lee como escrita por un humano para esa marca. Escribir primero el mensaje del cliente, después la respuesta.

## 3. Verificar a mano
- `supabase db reset` dos veces seguidas sin errores.
- Query de promedio por marca (en el spec en inglés): tres filas, promedios distintos, voltaire critical=1, kraftco critical=1.
- `npm run db:types && npm run typecheck`.
- Leer cinco replies en voz alta sin la columna de marca; hay que adivinar la marca siempre.

## 4. Checklist de review
- ¿Cada FK tiene un índice que empiece por ella? ¿Guardas de enum idempotentes? ¿`db reset` dos veces limpio?
- ¿Algún `text` donde se pidió enum? ¿Algún `sent_at` con fecha absoluta?
- ¿Las replies del seed suenan distinto de verdad, y la 101 es obviamente mala para alguien no técnico?
- ¿`database.types.ts` commiteado y al día?
