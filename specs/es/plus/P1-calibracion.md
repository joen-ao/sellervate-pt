# P1 · Calibración entre team leads
Rama `feat/calibration` · Migración `0003_calibration.sql` · Est. 90 min · Depende de 04

## 1. Producto
"Yo cubro cuatro de las seis y Nuria el resto, así que ninguna ve el panorama completo." Si dos leads califican distinto la misma respuesta, el número que ve la marca es el gusto de Marta, no un estándar. Calibrar hace visible la escala.

- Cualquier lead miembro marca una reply **Enviar a calibración** desde la cola o el panel.
- La cola gana el filtro `calibration`: marcadas que yo aún no revisé.
- `/calibration`: replies con ≥2 reviews, lado a lado (score, severidad, categorías, comentario por lead), ordenadas por delta de score desc y luego por desacuerdo de severidad.
- Sin arbitraje ni "respuesta correcta". Los specialists nunca ven esta página; `/me` muestra solo la review **más reciente** (simplificación documentada).
- Fuera: revisión ciega, sets de calibración entre marcas.

## 2. Plan técnico
- **Migración** (código en `P1-calibration.md`): `replies.calibration boolean`, `replies.calibration_requested_by`, índice parcial `where calibration`; policy de update en `replies` solo para leads miembros; función `calibration_pairs(p_brand_ids uuid[])` que devuelve pares con `review_count`, `score_delta`, `severity_mismatch`.
- **Seed** `seed/calibration.sql`: Nuria entra como segundo lead de Kraft&Co; marca 201 y 203 y las revisa (201: 4 vs el 3 de Marta; 203: 5 vs 5). Marta sigue fuera de Lume para no romper su caso de aislamiento.
- **Archivos**: `lib/data/calibration.ts` (`flagForCalibration`, `listCalibrationPairs`, `getCalibrationDetail`), `app/calibration/page.tsx` + `[replyId]/page.tsx`, `CalibrationToggle` en el panel de revisión, y el nuevo estado `calibration` en la cola (toca un archivo de 03: coordinar después del merge de 03).
- **DAL**: `flagForCalibration` → `requireRole('team_lead')` + `assertBrandMember` antes del update. `listCalibrationPairs` → RPC con los ids de membresía, hidrata nombres de marca y ambas reviews en una query.
- **UI**: tabla con Δscore grande (ámbar ≥2, rojo ≥3), badge de desacuerdo de severidad; detalle reutiliza `Exchange` y dos `ReviewReadOnly` lado a lado. Vacío: "Todavía no hay pares de calibración. Marca una reply y pídele a otro lead que la revise."

## 3. Verificar a mano
- Marta marca 202; Nuria la ve bajo `?status=calibration`, la revisa; `/calibration` muestra 202 con Δ.
- Orden por Δ correcto; badge de severidad donde difieren.
- Nuria ve solo pares de Kraft&Co + Lume; Marta excluye Lume.
- `/me` de Dani para 201 muestra una review (la más reciente).

## 4. Checklist de review
- ¿Policy de update en `replies` acotada a leads + membresía; un specialist no puede cambiar el flag vía API?
- ¿Índice parcial, no completo?
- ¿El cambio en la cola no debilitó el chequeo de membresía de 03?
