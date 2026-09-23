# 00 · Visión del sistema

## Qué es
Una herramienta interna para que los team leads de Sellervate registren su juicio sobre respuestas de soporte que los specialists ya enviaron a clientes en nombre de las marcas, y para que los specialists lean ese juicio.

**No** es un helpdesk, ni un inbox, ni tickets, ni un producto de AI. Nadie habla con un cliente aquí. Ningún modelo califica nada.

## Tesis de producto
Sellervate pierde cuentas cuando un specialist le dice a un cliente algo factualmente incorrecto sobre su propio producto, y hoy eso se descubre semanas tarde o nunca. La revisión del lead vive en Slack, no deja registro, y no sirve para coaching ni para mostrarle un número a la marca.

Construimos **el sistema de registro que convierte el juicio del lead en datos**: revisar rápido, marcar el error crítico aparte del tono, y que esos datos alimenten la conversación trimestral de "¿estamos mejorando?" y el onboarding de nuevos specialists.

Lectura elegida: **el loop de revisión** con una vista de tendencia por marca encima. Calibración, biblioteca, alertas, ingesta y reporte están especificados en `plus/` y se construyen si alcanza el tiempo, en ese orden.

## Roles y visibilidad
| | Team lead | Specialist |
|---|---|---|
| replies | todas las de sus marcas | solo las propias, en sus marcas |
| reviews | todas sobre esas replies | las de sus propias replies |
| stats de marca | sus marcas | nunca |
| escribir review | sus marcas | nunca |
| acknowledge | nunca | sus propias reviews |

Membresía many-to-many (`brand_members`). Un lead que no es miembro de una marca tampoco la ve.

## Innegociables (del brief)
- Login fingido con user switcher. **Autorización en el servidor**, antes de que salgan filas de la base.
- Cada cambio por un PR pequeño que el agente abre y yo reviso por escrito antes de mergear. Sin squash, sin rebase.
- Bordes ásperos sí; pantallas desconectadas no.
- Seed inventado: ≥2 marcas, 3 specialists, 2 team leads, suficientes filas calificadas.

## Stack (fijo)
Next.js 15 App Router · TypeScript strict · Supabase Postgres local (`supabase start`) · Tailwind 4 + daisyUI 5 con theme propio · zod · `@supabase/supabase-js` solo en servidor (sin cliente en browser en V1).

## Arquitectura en un párrafo
Los server components leen a través de `lib/data/*` (el DAL). Las server actions escriben por el mismo DAL. Los route handlers bajo `app/api` existen para que los evaluadores le peguen a la API con curl; llaman al mismo DAL. El DAL toma el usuario actual de una cookie httpOnly firmada, resuelve membresía y filtra cada query. RLS es una segunda puerta dentro de Postgres (spec 07) con un setting de alcance de transacción. Ninguna capa confía en un id de usuario que venga del request.

## Estructura del repo
(Idéntica a la versión en inglés; ver `00-system-overview.md`.)

## Reglas para todo agente (también en CLAUDE.md)
- La identidad sale solo de `getCurrentUser()`. Nunca de headers, params, body o un componente cliente.
- Toda función de `lib/data` recibe o resuelve el usuario actual y filtra por membresía en SQL. Sin filtrado post-fetch.
- Columnas nombradas en cada `.select()`. Sin `*`.
- Migraciones idempotentes: `create table if not exists`, `drop policy if exists` antes de `create policy`, guardas `do $$ … $$` para enums.
- Errores: lanzar `ForbiddenError` / `NotFoundError`; páginas usan `forbidden()`/`notFound()`; route handlers mapean a 403/404 JSON.
- Toda lista: vacío diseñado, carga (`loading.tsx` skeleton), error (`error.tsx` con reintentar).
- `gh pr create --fill --body-file .github/PR_BODY.md` con: qué cambió, qué revisar primero, qué se dejó fuera a propósito. Nunca mergear.

## Definición de terminado (todo el ejercicio)
Un extraño: `git clone` → `supabase start` → `supabase db reset` → `cp .env.example .env.local` → `npm i && npm run dev` → cambia a Marta → revisa una reply → abre Voltaire → ve la tendencia y el evento crítico → cambia a Dani → ve solo sus reviews → `curl` a Lume como Dani → 403. En menos de diez minutos.
