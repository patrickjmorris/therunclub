-- Merge spelling variants of the same tag ("trailrunning", "trail-running",
-- "trail runnings") into the most-used spelling. Topic key matches topicOf()
-- in src/lib/services/tag-service.ts. Rerunnable; backup kept on first run.
-- Run: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/consolidate-tag-variants.sql

begin;

create table if not exists content_tags_backup_20261029 as
	select * from content_tags;
alter table content_tags_backup_20261029 enable row level security;

create temp table tag_map on commit drop as
with t as (
	select tag, btrim(regexp_replace(tag, '\s+', ' ', 'g')) as clean, count(*) as n
	from content_tags group by tag
), k as (
	select tag, clean, n,
		case when regexp_replace(clean, '[\s-]+', '', 'g') = 'disciplines'
			then 'disciplines'
			else regexp_replace(regexp_replace(clean, '[\s-]+', '', 'g'), 's$', '')
		end as topic
	from t
), totals as (
	select clean, topic, sum(n) as n from k group by clean, topic
), canon as (
	select distinct on (topic) topic, clean from totals order by topic, n desc, clean
)
select k.tag, c.clean as canonical
from k join canon c using (topic)
where k.tag <> c.clean;

select count(*) as variant_tags, (select count(*) from content_tags ct join tag_map m using (tag)) as rows_affected
from tag_map;

-- Drop rows whose content already has the canonical tag, or another
-- variant of it, so the rename can't hit content_tag_idx.
delete from content_tags ct
using tag_map m
where ct.tag = m.tag
	and ct.id not in (
		select distinct on (c.content_id, c.content_type, coalesce(m2.canonical, c.tag)) c.id
		from content_tags c
		left join tag_map m2 on m2.tag = c.tag
		where coalesce(m2.canonical, c.tag) in (select canonical from tag_map)
		order by c.content_id, c.content_type, coalesce(m2.canonical, c.tag),
			(m2.tag is null) desc, c.id
	);

update content_tags ct set tag = m.canonical from tag_map m where ct.tag = m.tag;

select count(*) as tags_after, count(distinct tag) as distinct_after from content_tags;

commit;
