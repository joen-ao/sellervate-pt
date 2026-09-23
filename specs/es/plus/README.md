# Specs plus — se construyen después del core si el tiempo de atención lo permite

El orden es por cuánto reduce cada uno el riesgo de perder cuentas. Cada uno tiene slot de migración reservado y su propio archivo de seed para poder correr en paralelo.

| # | Nombre | Rama | Slot | Seed | Depende de |
|---|---|---|---|---|---|
| P1 | Calibración entre leads | `feat/calibration` | 0003 | `seed/calibration.sql` | 04 |
| P2 | Biblioteca de coaching | `feat/coaching-library` | 0004 | `seed/exemplars.sql` | 04 |
| P3 | Alertas de patrón | `feat/pattern-alerts` | 0005 | `seed/alerts.sql` | 04 |
| P4 | Ingesta desde helpdesk | `feat/ingestion` | 0006 | `seed/ingest.sql` | 01 |
| P5 | Reporte para el cliente | `feat/client-report` | 0007 | — | 05 |

RLS: toda tabla nueva lleva policies en su propia migración, mismo patrón que `0002`. Una rama plus que omita RLS en una tabla nueva es bloqueo de review.
