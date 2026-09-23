# 04 · Panel de revisión
Rama `feat/review-panel` · Sin migración · Est. 60 min · Oleada 2

## 1. Producto
Donde se registra el juicio. Legible de un vistazo, enviable en menos de un minuto. La guía de la marca está en pantalla porque es contra lo que se juzga.

- Ruta `/reviews/[replyId]`: team lead con membresía en la marca de la reply; si no, 403. Id desconocido → 404.
- Izquierda: marca + canal + specialist + hora; **Guía de la marca** colapsable; mensaje del cliente; respuesta.
- Derecha (sticky): score 1–5 (targets grandes, teclas 1–5); severidad `none | minor | critical` (rojo, ayuda: "Error factual o de procedimiento. Es el que cuesta cuentas."); chips de categoría con etiquetas humanas; comentario (placeholder "¿Qué le dirías a {nombre} sobre esta?"); **Guardar y siguiente** / **Guardar**.
- Reglas: `critical` exige ≥1 categoría; score obligatorio; comentario opcional; ya revisada por mí → card solo lectura "Revisado por ti el …"; reviews de otros leads no se muestran (P1).
- Fuera: edición, adjuntos, vista de segundo reviewer.

## 2. Plan técnico

### Archivos
```
lib/data/reviews.ts             # getReplyForReview, createReview
lib/validation/review.ts        # zod ReviewInput
app/reviews/[replyId]/page.tsx  loading.tsx  error.tsx  actions.ts
app/reviews/[replyId]/_components/{Exchange,GuidelinesPanel,ReviewForm,ReviewReadOnly}.tsx
```

### Validación (`lib/validation/review.ts`)
`ReviewInput` zod: `replyId` uuid, `score` 1–5 (coerce), `severity` enum, `categories` array de `z.enum(FAILURE_CATEGORIES)` máx 6, `comment` trim máx 2000, `andNext` boolean; `refine`: crítico ⇒ categorías no vacías, mensaje "Di qué tipo de error crítico." Espeja el check de la base; el form da el mensaje amable, la base es el respaldo.

### DAL (`lib/data/reviews.ts`)
Código en `04-review-panel.md`. Esencial:
- `getReplyForReview(replyId)`: `requireRole('team_lead')` → carga reply con marca y specialist → `assertBrandMember` **antes de devolver nada** → carga mi review si existe → devuelve `{ reply, brand, specialist, myReview }`.
- `createReview(input)`: `requireRole` → carga reply → `assertBrandMember` → insert; código de error `23505` (unique) → `ConflictError('Already reviewed')`.
- 06 pone `listMyReviews`/`acknowledgeReview` en `lib/data/my-reviews.ts` (archivo aparte) para no chocar.

### Server action (`actions.ts`)
`submitReview(prev, formData)`: arma el objeto desde `formData` (con `getAll('categories')`), `safeParse`; error → devuelve `fieldErrors` + `values`; `createReview` dentro de try; `ConflictError` → `formError`; `ForbiddenError` → `forbidden()`; `revalidatePath('/queue')` y `/me`; si `andNext`, `nextUnreviewedReplyId()` y `redirect` a la siguiente o a `/queue?caught_up=1`; si no, `redirect` a la misma reply.

**Trampa conocida**: `redirect()` lanza; tiene que quedar fuera del try/catch o re-lanzarse con `isRedirectError`. El agente lo va a hacer mal la primera vez — ese es un comentario de review.

### Form (`ReviewForm.tsx`, cliente)
`useActionState(submitReview, null)` + `useFormStatus`. Score como 5 radios `sr-only` con labels grandes; `onKeyDown` a nivel form mapea `1`–`5` cuando el textarea no tiene foco. Severidad como 3 radios segmentados; `critical` usa `--color-error`. Categorías como checkboxes `name="categories"` estilo chips; `fieldErrors.categories` debajo. Comentario conserva `values.comment` en error. "Guardar y siguiente" manda `andNext=1`. `formError` se muestra inline sobre los botones sin perder lo escrito.

### Página
`runPage` → `getReplyForReview` → `<TwoColumn>` con `Exchange` (incluye `GuidelinesPanel` como `<details>` cerrado, con la primera línea visible como summary) y `ReviewReadOnly` o `ReviewForm`. `loading.tsx`: skeleton de dos columnas. `error.tsx`: `ErrorCard` con reintentar.

## 3. Verificar a mano
- Marta abre `/reviews/…107`: guía colapsada con la primera línea de Voltaire visible; teclas 1–5 funcionan.
- `critical` sin categoría → error inline bajo los chips, valores intactos.
- Enviar con comentario + "Guardar y siguiente" → cae en 108; contador de `/queue` baja uno.
- `/reviews/…101` (ya revisada) → card solo lectura.
- Reabrir 107 → card solo lectura.
- Como Dani `/reviews/…101` → forbidden. Como Nuria → forbidden (no es miembro de Voltaire).
- Id desconocido → not found.

## 4. Checklist de review
- ¿`assertBrandMember` antes de devolver datos y antes del insert?
- ¿`categories` tipadas con `z.enum(FAILURE_CATEGORIES)`, no `z.array(z.string())`?
- ¿Unique violation mapeada a mensaje amable; otros errores se relanzan?
- ¿`redirect()` fuera del try/catch?
- ¿El form conserva estado ante error? ¿"Guardar y siguiente" degrada bien cuando no queda nada?
- ¿Algún `useEffect` haciendo fetch en cliente? (no debería haber)
