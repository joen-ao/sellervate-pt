# 05 · Tendencia por marca
Rama `feat/brand-trends` · Migración solo-funciones `0001_2_brand_stats_fn.sql` · Est. 40 min · Oleada 2

## 1. Producto
"Preferiría mostrarles el número que decir la frase." Una página por marca que el lead abre en la reunión.

- Ruta `/brands/[slug]`: team lead con membresía; specialists nunca.
- Números de cabecera (30 d vs 30 anteriores): promedio, reviews, críticos, deltas.
- Tendencia: promedio por semana ISO, últimas 8 semanas, barras SVG inline.
- "Lo que seguimos haciendo mal": categorías por frecuencia (30 d).
- Eventos críticos: lista, más reciente primero, link a la review.
- Por specialist: promedio + críticos (solo lead).
- Fuera: reporte imprimible (P5), comparación entre marcas, métricas externas.

## 2. Plan técnico

### Archivos
```
supabase/migrations/0001_2_brand_stats_fn.sql   # solo funciones, sin tablas; decirlo en el PR
lib/data/brand-stats.ts                          # getBrandStats(slug)
app/brands/[slug]/page.tsx  loading.tsx  error.tsx
app/brands/[slug]/_components/{StatCards,TrendChart,CategoryList,CriticalList,SpecialistTable}.tsx
```

### Agregación en SQL — un RPC, no cinco queries reducidas en JS
Función `brand_stats(p_brand_id uuid, p_days int default 30) returns jsonb` (código en `05-brand-trends.md`): CTEs `base`/`cur`/`prev`, y un `jsonb_build_object` con `current`, `previous`, `weekly` (date_trunc('week')), `categories` (unnest + count), `critical_events`, `by_specialist`.

### DAL
`getBrandStats(slug)`: `requireRole('team_lead')` → `resolveMemberBrand` (403/404 primero) → `admin.rpc('brand_stats')` → **zod** sobre el jsonb (nunca confiar en la forma a ciegas) → un query a `profiles` para hidratar nombres de specialists → `{ brand, stats }`.

Por qué la verificación de membresía no va dentro de la función SQL: RLS (07) hará esa capa; el chequeo en el DAL mantiene la semántica de 403 igual que en el resto de páginas.

### Componentes
- `StatCards`: tres cards con delta; el delta de críticos en `--color-error` cuando sube y **neutral** cuando baja (nunca verde: un crítico nunca es buena noticia, solo bajó).
- `TrendChart`: SVG puro `viewBox="0 0 640 160"`, una barra por semana, etiqueta `dd MMM`, eje y de 1 a 5, líneas guía en 3 y 4. Semanas vacías como hairline con `n=0`. Sin librería.
- `CategoryList`: ranking con conteo y barra proporcional; etiquetas de `CATEGORY_LABEL`.
- `CriticalList`: fecha · specialist · snippet → `/reviews/[reply_id]`.
- `SpecialistTable`: nombre, promedio, n, críticos; peor primero.
- Vacío: `n === 0` → "No hay reviews de {marca} en los últimos 30 días. Las reviews de la cola aparecen aquí."

## 3. Verificar a mano
- `/brands/voltaire` como Marta: promedio ≈ 3.2, críticos 1, "No revisó el historial del pedido" en la lista, evento crítico enlaza a 101.
- `/brands/kraftco`: promedio distinto; "Tono fuera de marca" y "Correcta pero…" arriba; 206 de Iker en críticos.
- `/brands/lume` como Marta → forbidden. Como Nuria → renderiza con n=1.
- `/brands/voltaire` como Dani → forbidden.
- `select brand_stats('…0001')` en psql da los mismos números que la página.

## 4. Checklist de review
- ¿Alguna agregación en JS sobre filas? (solo hidratar nombres)
- ¿Membresía antes del RPC?
- ¿jsonb validado con zod?
- ¿Límites de semana (`date_trunc('week')`, lunes) coherentes con la etiqueta?
- ¿"Bajaron los críticos" se muestra neutral, no celebratorio?
