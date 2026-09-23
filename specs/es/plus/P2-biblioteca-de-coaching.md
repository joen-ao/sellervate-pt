# P2 · Biblioteca de coaching
Rama `feat/coaching-library` · Migración `0004_exemplars.sql` · Est. 90 min · Depende de 04

## 1. Producto
"Cuando entra alguien nuevo lo sentamos con las buenas y las malas y explicamos la diferencia." Cada review ya tiene un ejemplo y el porqué; la biblioteca es un filtro.

- Panel de revisión: checkbox **Usar como ejemplo** (lead). Setea `reviews.is_exemplar`.
- `/brands/[slug]/library`: **Buenas** (ejemplar, score ≥4) y **Lo que no hay que hacer** (ejemplar, score ≤2 o crítico). Card = mensaje, respuesta, chips, comentario del lead como "por qué". Guía fijada arriba.
- Nombres de autores ocultos por defecto; toggle del lead "mostrar autores". Specialists miembros pueden leer la biblioteca — la única ampliación deliberada de su regla: anonimizada, solo ejemplares.
- Fuera: orden curado, exportar, comentarios sobre ejemplos.

## 2. Plan técnico
- **Migración** (código en `P2-coaching-library.md`): `reviews.is_exemplar`, índice parcial; policy adicional de select en `replies` para ejemplares en marcas miembro sin importar el autor; policy de update en `reviews` para que leads miembros marquen el flag.
- **Cuidado**: `reviews_update_ack` (07) y `reviews_update_exemplar` coexisten y Postgres hace OR de policies permisivas. Para que un lead no pueda tocar `acknowledged_at` ni un specialist `is_exemplar`, agregar un trigger `before update` `reviews_guard_columns` que lea `current_app_role()` y lance si la columna no corresponde al rol. Vale una frase en DECISIONS.
- **Seed** `seed/exemplars.sql`: 101, 102, 202, 203 como ejemplares.
- **Archivos**: `lib/data/library.ts` (`listLibrary(slug, { showAuthors })`, `setExemplar`), `app/brands/[slug]/library/…`, `ExemplarToggle` en el panel.
- **DAL**: `listLibrary` usa `requireUser()` (ambos roles) + `resolveMemberBrand`; parte buenas/malas en SQL; incluye nombre de autor **solo** si `showAuthors && role === 'team_lead'` (no ocultar en JSX: no mandarlo).
- Guardia de ruta: un specialist en `/brands/[slug]` (05) sigue recibiendo 403; solo `/library` es abierta a miembros. La página de biblioteca tiene su propio `requireUser`, no hereda un guard de layout.

## 3. Verificar a mano
- Marta marca 104 como ejemplo → aparece en "Lo que no hay que hacer" de Voltaire.
- Dani abre `/brands/voltaire/library` → la ve, sin nombres; `/brands/voltaire` → 403 sigue.
- Iker `/brands/voltaire/library` → 403.
- Prueba RLS: como Dani, `count(replies where specialist_id <> dani)` ya no es 0 sino el número de ejemplares ajenos en sus marcas (2) — esperado y documentado.

## 4. Checklist de review
- ¿Trigger de guarda de columnas presente?
- ¿Los nombres nunca van en el payload cuando están ocultos?
- ¿La página de biblioteca tiene auth propia?
