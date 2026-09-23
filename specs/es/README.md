# Specs (versión en español)

Escritos **antes** del código. Cada sesión con un agente recibe `00` más el spec de su rama. No son el entregable (eso es `DECISIONS.md`); son la forma de que varios agentes y yo no perdamos consistencia.

Estructura de cada spec de feature:
1. **Producto** — por qué, quién, qué regla, qué queda fuera.
2. **Plan técnico** — archivos, firmas, queries, componentes, validación.
3. **Verificar a mano** — lo que hago antes de escribir el review del PR.
4. **Checklist de review** — qué busco en el diff del agente.

Los bloques de código son idénticos a los de la versión en inglés (que es la que se commitea como principal). Cuando un bloque es largo, aquí se referencia en vez de duplicarlo, para que no haya dos versiones que diverjan.

| Archivo | Rama | Slot de migración | Depende de |
|---|---|---|---|
| 00-vision-del-sistema.md | — | — | — |
| 01-modelo-de-datos-y-seed.md | `feat/schema-seed` | `0001` | — |
| 02-usuario-actual-y-autorizacion.md | `feat/current-user-dal` | — | 01 |
| 03-cola-de-revision.md | `feat/review-queue` | — | 02 |
| 04-panel-de-revision.md | `feat/review-panel` | — | 02 |
| 05-tendencia-por-marca.md | `feat/brand-trends` | — | 02 |
| 06-vista-del-specialist.md | `feat/specialist-view` | — | 02 |
| 07-rls-y-estados-de-ui.md | `feat/rls-defense` | `0002` | 01, 03–06 |
| plus/P1–P5 | ver plus/README | `0003`–`0007` | ver tabla |

`PARALELO.md` explica cómo corren varias ramas a la vez sin pisarse.
