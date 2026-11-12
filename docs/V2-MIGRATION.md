# V2 migration and acceptance plan

Development branch: `v2-development`. The `main` branch is not modified until user acceptance.

## Legacy storage (do not delete)
- `momo-study-journal-v1`: date-keyed records; legacy imports also support `{records: ...}`.
- `momo-study-task-names-v1`: task labels.
- `momo-study-default-plan-v2`: default schedule.

## Compatibility contract
1. Preserve all existing storage keys and existing records verbatim until a migration is validated.
2. New mainline data must use a separate namespaced key, with schema version and stable IDs.
3. An absent actual duration is unknown, never zero.
4. Import must validate shape and preview before committing. Export must include all old and new data.
5. Never overwrite manually edited sharing drafts. D-number increments only when publication is explicitly confirmed.
6. Language switching translates UI labels only; never translate user-entered diary/code or original course titles.
7. Remove hard-coded 2026-11-12 sample initialization only after checking that existing stored entries take precedence.
8. Do not store confidential company source code in public GitHub files.

## Acceptance tests
- Existing date records remain readable and editable.
- Morning schedule recomputation and manual override continue working.
- Mainline tasks link to daily tasks without duplicate copies.
- New entries persist after reload and survive backup/import.
- Chinese/Japanese UI toggles persist without changing content.
- Sharing template preserves original diary, statuses, and D numbering.
- AI plan import rejects invalid JSON, previews valid tasks, and only saves after confirmation.
- Navigation works on mobile and desktop.
- No edits or merges to `main` before explicit user acceptance.

## Backup procedure for the user
Open the current site, choose **备份数据**, save the JSON file outside the browser, and verify the file exists before testing the development build.
