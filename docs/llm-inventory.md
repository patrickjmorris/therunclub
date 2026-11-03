# LLM inventory

As of 2026-11-02. Checked against code at `6efae12`, read-only prod queries, and an unauthenticated request to prod.

All four use cases call OpenAI directly with `OPENAI_API_KEY`. No other LLM provider or client is used in `src`, `scripts`, or `supabase`.

## Use cases

| Use case | Owner | Model | Trigger | Monthly cost | Trace location | Eval status | Still used? |
|---|---|---|---|---|---|---|---|
| Club info from text (`src/lib/services/openai-service.ts:124`) | Patrick Morris | `gpt-4o-mini` | Admin or editor submits `/clubs/add` | $0, **Estimate** | Vercel logs: `console.log` of input and output | None | **Looks unused.** Last club written 2025-04-05 |
| Tagging API (`src/app/api/tagging/route.ts:429`) | Patrick Morris | `gpt-4o-mini` by default, any model through `?model=` | Manual `GET` or `POST` with a job secret; no cron | $0, **Estimate** | Vercel logs: item ID and tags only, no prompt or tokens | None | **Looks unused.** Last tag written 2025-05-14 |
| Tag backfill (`scripts/backfill-tags.ts:299`) | Patrick Morris | `gpt-4o-mini`, Batch API | Manual: `bun run backfill:tags` or `backfill:tags:prod` | $0, **Estimate** | Local terminal only | None | **Looks unused.** Last tag written 2025-05-14 |
| Athlete bios and social links (`scripts/import-athletes.ts:415`) | Patrick Morris | `gpt-4o`, Batch API | Manual: `bun run scripts/import-athletes.ts generate-bios` | $0, **Estimate** | Local terminal only; results file is not in the repo | None | **Looks unused.** Last change to a row with a bio 2025-04-28 |

Owner is inferred: Patrick Morris is the only committer on these files, and there is no `CODEOWNERS`.

## Cost label

**Estimate** means $0 is inferred from no prod writes. It is not a billed figure:
- No OpenAI bill was available, and the app stores no token or cost records.
- A call that writes nothing, such as a failed run, would not show up.
- For scale, `gpt-4o-mini` lists at $0.15/$0.60 per 1M input/output tokens, and half that on Batch.

## Usage evidence

No recorded use in the last 18 months. Each table's writes stop by May 2025, while content kept arriving.

| Check | Result |
|---|---|
| `running_clubs` | 132 rows, all created in 2025-04; latest `created_at` 2025-04-05 |
| `content_tags` | 109,480 rows from 2025-02-26 to 2025-05-14; none in the last 90 days |
| Content added after the last tag | 9,576 videos by `created_at`, 7,690 episodes by `pub_date` |
| `athletes` | 1,141 of 8,582 have a bio; latest `updated_at` on those rows 2025-04-28 |
| `vercel.json` crons | None call `/api/tagging` |
| Prod triggers and scheduler | No triggers on `videos`, `episodes`, or `podcasts`; no `pg_cron` |

Limits of this evidence:
- `content_tags` does not record its source, so the route and the backfill can't be told apart. The same last-write date applies to both.
- Vercel logs were not checked, and an external scheduler can't be ruled out. A working one would have tagged new content, and none was tagged.
- `updated_at` on `athletes` is not specific to bios. It gives an upper bound on the last bio run.

The code is still live even though it looks unused. `/clubs/add` is linked from the public clubs page, and the tagging route is deployed. `content_tags` is still read by `tag-service.ts` and `paginated-service.ts`, so tag-based features see no content newer than May 2025.

## Access control

**Tagging API: authenticated.** `isAuthorizedJob` (`src/lib/api-auth.ts:11`) requires `x-api-key: $UPDATE_API_KEY` or `Authorization: Bearer $CRON_SECRET`. An unauthenticated request to prod returned 401 on 2026-11-02. It used `hours=0&batchSize=0`, so it could not have tagged anything.

`?model=` is not validated:
- Anyone with either secret can run any model on our OpenAI key.
- `batchSize` and `hours` have no cap, and `forceTag` retags content that already has tags.
- Commit `8e0569a` (2026-10-28) added this auth helper and describes it as fixing a `Bearer undefined` bypass. Earlier exposure depended on whether `CRON_SECRET` was set in prod, which was not checked.

**Club extraction: authenticated.** `requireContentManager` runs before the OpenAI call (`src/app/clubs/actions.ts:24`), so only admins and editors reach the model. The page itself is public.

**Scripts:** these need local credentials and have no HTTP surface.

## Risks

1. **Models shut down on 2027-01-14.** OpenAI's [deprecations page](https://developers.openai.com/api/docs/deprecations) lists the `gpt-4o` and `gpt-4o-mini` snapshots for removal on that date, with `gpt-6-luna` as the replacement. All four use cases use these models. The tagging route would fail quietly: `generateTags` catches the error and returns no tags, and the route still answers 200 with a `failed` count.
2. **Unverified LLM social links are public.** `generate-bios` asks `gpt-4o` for social handles at temperature 0.85 and writes them with no check. `profile-section.tsx:165` renders them as links, and `src/app/athletes/[slug]/page.tsx:220` adds them to `sameAs` structured data. Many are not URLs, so those links are broken on the page. Accuracy of the bios and handles was not assessed.
3. **Club output is published without review.** The action inserts the model's output into `running_clubs` directly, and the data appears on `/clubs`.
4. **Raw club input and output go to logs** through `console.log` (`src/app/clubs/actions.ts:26`).

Values in `athletes.social_media` on rows with a bio. The source of each value isn't recorded, so some may not come from the LLM:

| Field | Non-empty | Not `http(s)://` |
|---|---:|---:|
| instagram | 971 | 868 |
| twitter | 400 | 370 |
| facebook | 296 | 38 |
| website | 98 | 22 |

## Stale or unreachable code and docs

- `batchExtractClubInfo` and `enhanceClubMetadata` (`src/lib/services/openai-service.ts`) have no callers.
- `question()` (`scripts/backfill-tags.ts:201`) has no callers.
- The `deploy:tagging-function` and `apply:tagging-triggers` scripts in `package.json` point at files that don't exist.
- `docs/tagging-setup.md` still describes the Edge Function and triggers those scripts were for.

## Decisions needed

- [ ] Clubs: keep or cut extraction.
- [ ] Tagging: restore it on a cron for content since May 2025, or cut the route and backfill.
- [ ] Bios: keep or cut generation, and decide what to do with the existing social links.
- [ ] Anything kept: move off `gpt-4o` and `gpt-4o-mini` before 2027-01-14, and add a cost record and an eval.
- [ ] Tagging, if kept: allowlist `?model=` and cap `batchSize` and `hours`.

## Reproduce

Run read-only: start with `begin read only;`. The Supabase pooler ignores `default_transaction_read_only` set through `PGOPTIONS`.

```sql
select count(*), max(created_at) from running_clubs;
select count(*), min(created_at), max(created_at) from content_tags;
select count(*) from videos where created_at > '2025-05-15';
select count(*) from episodes where pub_date > '2025-05-15';
select count(*), count(bio) from athletes;
select max(updated_at) from athletes where bio is not null;
```
