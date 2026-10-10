# Google Calendar phase 1 contracts

This design implements only #17 phases 1–2. Outbound/bidirectional sync, background delivery, conflict resolution and full provider/device acceptance remain later phases. Google authorization is separate from LifeOS login; Apple #31 is unchanged.

## Ownership and authorization

One active Google account per verified LifeOS user. Request only `openid`, `email`, `calendar.calendarlist.readonly` and `calendar.events.readonly`; no event-write scope or method. Use Google's web-server authorization-code flow, state and PKCE, in the external browser. The Google callback terminates at the API, never the Supabase Auth callback. Return destinations are server-configured exact web/native URLs, not arbitrary request URLs.

An authenticated start creates a ten-minute attempt bound to the caller, a one-use state hash, encrypted PKCE verifier and a separate completion-proof hash. The client retains only attempt ID/proof. The public callback atomically consumes state and holds encrypted credentials provisionally. Linking requires authenticated completion by the same LifeOS user plus the original proof and a separate random receipt delivered only by the callback redirect (its hash is held server-side); a stolen callback/deep link cannot link another account, and an initiator cannot complete a link from a different browser without that returned receipt. Completion retries use the same bound hashes and are idempotent; callback replay remains rejected. New attempts, cancellation, disconnect and expiration invalidate pending completion. Repeat callbacks fail closed. Reconnect cannot silently substitute a different Google account while one remains connected.

AES-256-GCM protects refresh credentials and pending verifiers with a dedicated server key and owner/purpose associated data. Private-schema storage and narrowly granted service-only RPCs prevent anonymous/authenticated SQL/API access to credentials. The existing caller-JWT/RLS path remains the only path for ordinary product operations. A new server-only Supabase secret/service key is limited in application use to the integration RPC; never ship it in Expo config. Neither provider tokens nor provider error payloads appear in client DTOs/logs. Key rotation/re-encryption is an operational gate, not silently generated production configuration.

## Canonical commitments and time

Imported occurrences live in `commitments`, not a second event list. Stable identity is `(LifeOS user, Google account subject, calendar ID, event/instance ID)`, with a retained recurring-series ID and originalStartTime. iCalUID is metadata, not a deduplication key across calendars: separate selected calendars may contain independent copies. Repeated imports/reconnect of the same account/calendar/event update the same commitment ID.

Add nullable free-text location (trim; blank -> null; max 2000 UTF-16 code units at application boundaries) as the #15 foundation. Do not put it in description. Local commitments remain timed/start-only and editable. Imported occurrences are read-only in this phase, even with owner/writer provider permission; no local edit or reminder silently diverges from Google. Full #15 visual/device acceptance stays separate.

Timed imports retain exact offset-bearing start/end instants and provider timezone. Dates/time projections use the LifeOS account timezone captured for the import. End dates cover every overlapping local day; exclusive midnight ends do not add an extra day. All-day imports preserve floating start and exclusive end dates, with no invented task time or busy duration. Free/transparent events contribute no busy duration. Expanded recurring instances retain moved start/end and original occurrence identity; cancelled/absent instances are hidden after a complete reconciliation. No local recurrence editor is provided.

Provider descriptions are retained as text, never executed as HTML; original provider formatting may appear literally. Do not silently truncate oversized unsupported data: fail the reconciliation and retain the previous snapshot. Missing/private titles use a truthful unnamed-event label. No imported provider reminders become LifeOS reminders.

## Selection, import and disconnect

List calendars with actual access role and timezone; freeBusyReader calendars cannot import event details. No automatic selection, including primary calendars. Saving selection is distinct from explicit import/refresh. Empty selection is valid. Deselect/disconnect hide imported local records but never delete Google events or local-only commitments. Re-select/reconnect reuses retained IDs after explicit import; no historical plan/task is mutated.

Initial/repeat import uses a bounded rolling window from UTC midnight minus 30 days through UTC midnight plus 180 days (exclusive), with `singleEvents=true`, `showDeleted=true`, full pagination and calendar IDs from the server-validated selection. A full selected-calendar snapshot is committed atomically only after all pages normalize successfully. A server lease plus revision check prevents overlapping imports, old selection results and disconnect races from repopulating stale data. Failures preserve the last successful snapshot and expose retry/reconnect state. No unbounded provider scan or partial-page deletion.

Within that window, absence/cancellation hides the previous linked occurrence; imported snapshots outside the window are retained as historical data, not a claim of current synchronization. Selection/disconnect hide all affected imported records. Refresh is explicit in this slice; background jobs/webhooks are pending.

## Future outbound, conflict and deletion requirements

Phase 3 must add explicit incremental write consent and a user-selected writable default calendar. Creating/exporting a local commitment requires an operation ledger/provider-stable ID, confirmed start/end and timezone; start-only events require a user-supplied end/duration, never an invented default. Bulk export requires explicit preview/approval. Tasks/templates/Focus never become events. Respect calendar roles, event organizer/guest restrictions and avoid invitation/attendee changes.

Store last-synchronized etag/version plus local revision for three-way conflict detection. Concurrent local/provider edits require visible resolution; retry ambiguous creates by stable identity before attempting another create. Separate delete-both from hide-in-LifeOS, retain tombstones and prevent resurrection/echo loops. Disconnect cancels pending outbound operations before credential removal and never deletes provider events.

Phase 4 incremental synchronization must use a cursor per account/calendar/query shape. `syncToken` cannot be combined with timeMin/timeMax; do not attach a bounded-window cursor to different queries. Use an explicitly designed unbounded incremental cache plus bounded projection, or retain bounded full reconciliation. On HTTP 410 discard only the affected cursor and rebuild atomically, preserving stable local identities. Recurrence-series operations, DST, moved exceptions, missed notifications and background refresh need full provider evidence before completion.

## Official sources checked 2026-10-09

- [Web-server OAuth](https://developers.google.com/identity/protocols/oauth2/web-server) and [OAuth security guidance](https://developers.google.com/identity/protocols/oauth2/resources/best-practices).
- [Calendar scopes](https://developers.google.com/workspace/calendar/api/auth) and [calendar list](https://developers.google.com/workspace/calendar/api/v3/reference/calendarList/list).
- [Event representation](https://developers.google.com/workspace/calendar/api/v3/reference/events), [event listing/window semantics](https://developers.google.com/workspace/calendar/api/v3/reference/events/list), [recurring instances](https://developers.google.com/workspace/calendar/api/guides/recurringevents) and [incremental sync](https://developers.google.com/workspace/calendar/api/guides/sync).
