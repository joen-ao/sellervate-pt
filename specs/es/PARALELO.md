# Trabajar con varios agentes en paralelo

## Grafo de dependencias
```
01 schema+seed
 └─ 02 usuario actual + base del DAL
     ├─ 03 cola            ─┐
     ├─ 04 panel           ─┼─ 07b barrido de estados de UI (cuando los cuatro mergeen)
     ├─ 05 tendencia       ─┤
     └─ 06 vista specialist─┘
 └─ 07a RLS (solo necesita 01; corre junto a 03–06)
04 ─┬─ P1 calibración
    ├─ P2 biblioteca
    └─ P3 alertas
01 ─── P4 ingesta
05 ─── P5 reporte
```

## Oleadas
| Oleada | Ramas (en paralelo) | Reloj de pared |
|---|---|---|
| 0 | 01 | ~45 min, sola — todo depende de ella |
| 1 | 02 | ~30 min, sola — define los contratos de abajo |
| 2 | 03, 04, 05, 06, 07a-RLS | ~60 min |
| 3 | 07b UI, P4, P5 | ~45 min |
| 4 | P1, P2, P3 | ~60 min |

No arrancar la oleada 2 hasta que 02 esté mergeado. Un conflicto en `lib/data` cuesta más que 30 minutos de espera.

## Contratos fijados en la oleada 1 (nadie los cambia después)
- `lib/errors.ts` — `ForbiddenError`, `NotFoundError`, `ConflictError`.
- `lib/current-user.ts` — `getCurrentUser()`, `requireUser()`, `requireRole(role)`.
- `lib/data/membership.ts` — `getMemberBrandIds`, `assertBrandMember`, `resolveMemberBrand`.
- `lib/supabase/admin.ts` — el único cliente Supabase.
- `lib/database.types.ts` — generado; solo lo regenera la rama dueña de una migración.
- `app/forbidden.tsx`, `app/not-found.tsx` — páginas de error compartidas.

## Reglas de propiedad
- Una rama **crea** archivos bajo su carpeta de ruta y su propio `lib/data/<nombre>.ts`. No edita el DAL de otra rama. Helpers compartidos van en `lib/data/_shared.ts` solo desde 02.
- Los números de migración están reservados. Una rama que necesita migración usa su slot y regenera `database.types.ts`; el orden de migraciones es por número, no por orden de merge.
- `seed.sql`: solo lo tocan 01 y P4. P1–P3 agregan filas en `supabase/seed/<nombre>.sql`, que `db reset` aplica vía `config.toml` (`[db.seed] sql_paths`).
- Todo agente corre `npm run typecheck && npm run lint` antes de abrir el PR.

## La disciplina de PRs sigue igual
Una rama = un PR = legible en cinco minutos. Paralelo no significa más grande. Una rama que pase de ~400 líneas de diff se parte.

## Reporte de tiempo
El README dice cuántos agentes corrieron en paralelo y que las horas reportadas son mi tiempo de atención (revisar, decidir, probar), registrado en `docs/sessions/time-log.md`. No reclamamos el paralelismo de reloj de pared como "seis horas"; reclamamos lo que me costó a mí.
