# Ingestion field mappings

Every adapter produces the normalised item in `lib/validation/ingest.ts` and
POSTs a batch (1–500 items) to `/api/ingest/<sourceId>` with that source's bearer
token. Only the CSV adapter exists as code; the two below are the documented
mapping for when a Gorgias or Zendesk adapter is written. Field names are from
each vendor's public REST docs and must be re-checked against the API when the
adapter is built.

One reply = one outbound agent message, paired with the customer message it
answers (the latest inbound message before it on the same ticket).

| Normalised field   | CSV column         | Gorgias (ticket messages)                     | Zendesk (ticket comments)                           |
|--------------------|--------------------|-----------------------------------------------|-----------------------------------------------------|
| `external_id`      | `external_id`      | `"gorgias-" + message.id`                     | `"zendesk-" + comment.id`                           |
| `specialist_email` | `specialist_email` | `message.sender.email` where `from_agent`     | `users/{comment.author_id}.email`, agent role       |
| `customer_message` | `customer_message` | previous message with `from_agent = false`, `body_text` | previous public comment by the requester, `plain_body` |
| `reply_text`       | `reply_text`       | `message.body_text`                           | `comment.plain_body`, only `public = true`          |
| `sent_at`          | `sent_at`          | `message.sent_datetime`                       | `comment.created_at`                                |
| `channel`          | `channel`          | `ticket.channel` → `email`; marketplace integrations → `amazon` / `walmart`; Shopify contact form → `shopify` | `ticket.via.channel` → `email` / `web` → `shopify` if the brand's form; anything else → `email` |

Not mapped on purpose: internal notes (Gorgias `is_internal`/non-public, Zendesk
`public = false`), attachments, and ticket metadata. `brand_id` is never part of
the payload: it comes from the source row the token belongs to.

`external_id` is prefixed with the vendor so two sources can never collide, but
uniqueness is already per source (`unique(source, external_id)`), so the prefix
is for humans reading `replies_unmatched`.

Out of scope for P4: OAuth to the vendor, polling, two-way sync.
