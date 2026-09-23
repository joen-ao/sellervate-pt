# P3 · Alertas de patrón por specialist
Rama `feat/pattern-alerts` · Migración `0005_alert_acks.sql` · Est. 60 min · Depende de 04

## 1. Producto
"Uno estuvo cerrando tickets sin revisar el historial de pedidos durante un mes. Nos enteramos porque la marca se enteró." Los datos para detectarlo al cuarto día están en `reviews`. SQL, no un modelo.

Reglas (ventana 14 días, por specialist por marca): ≥2 críticos · misma categoría ≥3 · promedio <2.5 con ≥5 reviews.
- Franja en `/queue`: "N patrones necesitan atención" → `/alerts`.
- `/alerts`: una card por (specialist, marca, regla) con links a la evidencia; **Marcar como conversado** registra quién y cuándo.
- Los specialists nunca ven alertas.
- Párrafo del modelo para DECISIONS: un modelo podría pre-marcar replies sin revisar que se parezcan a un patrón conocido para que salten en la cola; necesita cientos de reviews etiquetadas por marca, precisión medida, y solo reordena — nunca califica.

## 2. Plan técnico
- **Migración** (código en `P3-pattern-alerts.md`): tabla `alert_acknowledgements(brand_id, specialist_id, rule, rule_key, window_end, acknowledged_by, acknowledged_at, note)` con índice de lookup y RLS solo leads miembros con `acknowledged_by = yo`; función `pattern_alerts(p_brand_ids, p_days=14)` que une tres CTEs (`crit`, `cat`, `low`) y devuelve `evidence uuid[]` y `latest`.
- Alertas abiertas = resultado de `pattern_alerts` menos las que tienen un ack con `window_end >= latest`. Una query extra en el DAL.
- **Seed** `seed/alerts.sql`: dos reviews más de Dani en Voltaire con `no_order_history_check` (−4d, −6d; ids 110, 111) para que dispare `category_x3`.
- **Archivos**: `lib/data/alerts.ts` (`listOpenAlerts`, `acknowledgeAlert`), `app/alerts/…`, `AlertStrip` en la cola (coordinar después de 03).
- **UI**: card "Dani · Voltaire — 'No revisó el historial del pedido' ×3 en 14 días", pills de evidencia con link, textarea de nota + botón. Franja ámbar en la cola. Vacío: "Sin patrones en los últimos 14 días en {marcas}."

## 3. Verificar a mano
- Marta ve la franja "1 patrón"; `/alerts` muestra Dani · Voltaire · categoría ×3 con tres pills.
- Acknowledge con nota → desaparece; fila en `alert_acknowledgements`.
- Otra review que coincida → la alerta reabre (latest > window_end).
- Nuria sin alertas; Dani `/alerts` → 403.

## 4. Checklist de review
- ¿Umbrales solo en la función SQL, no duplicados en TS?
- ¿El insert del ack asegura membresía y `acknowledged_by = yo`?
- ¿La franja cuesta un RPC + un lookup, no más?
