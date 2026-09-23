# P5 · Reporte para el cliente
Rama `feat/client-report` · Migración `0007_report_notes.sql` · Est. 30–45 min · Depende de 05

## 1. Producto
"Preferiría mostrarles el número que decir la frase." `/brands/[slug]` es la vista de trabajo del lead; la reunión necesita una versión sin nada interno.

- `/brands/[slug]/report?from&to` (por defecto últimos 90 días). Marca, período, wordmark pequeño.
- Tres números: calidad promedio, respuestas revisadas, incidencias críticas (con "atendidas: N" desde los acks de P3 si existe).
- Tendencia semanal; **Las tres cosas que más mejoramos** (caída de frecuencia de categoría vs período anterior, de los datos); **En qué estamos trabajando** (nota del lead por período).
- Quita toda persona: sin nombres, sin tabla por specialist, sin comentarios.
- `@media print` → "Guardar como PDF" es la exportación.
- Solo lead con membresía. Link público tokenizado es V3.

## 2. Plan técnico
- **Migración** (código en `P5-client-report.md`): `brand_report_notes(brand_id, period_start, period_end, working_on, updated_by, updated_at)` con RLS (leads miembros, `updated_by = yo`); función `brand_report(p_brand_id, p_from, p_to) returns jsonb` con `avg`, `n`, `critical`, `weekly`, `improved` (full join de conteos de categoría actual vs anterior, delta > 0, top 3).
- **Archivos**: `lib/data/report.ts` (`getBrandReport`, `saveWorkingOn`), `app/brands/[slug]/report/…` con `print.css`, componentes `ReportHeader`, `ReportNumbers`, `ImprovedList`, `WorkingOnForm`; reutiliza `TrendChart` de 05.
- **DAL**: `requireRole('team_lead')` + `resolveMemberBrand` → RPC → zod → nota → (si P3 está mergeado) conteo de acks en el período, con `try` alrededor por si la tabla no existe; decirlo en el PR.
- **UI**: theme claro forzado en esta ruta (`data-theme="sellervate-print"`); una A4; el form oculto al imprimir. Vacíos: sin período anterior → "Primer período registrado"; `n=0` → "Sin reviews en este período."

## 3. Verificar a mano
- `/brands/voltaire/report` como Marta renderiza; vista previa de impresión = una página; ningún nombre de specialist (`grep -c "Dani"` en el HTML → 0).
- Guardar "En qué estamos trabajando" → persiste; Nuria para Lume tiene su propia nota.
- `/brands/lume/report` como Marta → 403; como Dani → 403.
- `?from=2020-01-01&to=2020-02-01` → "Sin reviews en este período."

## 4. Checklist de review
- ¿El payload no contiene ids ni nombres de specialists (revisar el tipo de retorno del DAL, no el JSX)?
- ¿Params de fecha validados (`from < to`, máx 366 días)?
- ¿El stylesheet de impresión oculta el form y el switcher?
- ¿El upsert de nota está acotado por `updated_by = yo` en RLS?
