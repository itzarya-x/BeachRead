-- Recommendation Engine and Intelligence Utilities

-- View for "Next to Read" (Series currently reading with remaining chapters)
create or replace view public.next_to_read as
select 
  le.user_id,
  t.id as title_id,
  t.title_romaji as title,
  t.cover_url,
  le.progress,
  t.chapters_total,
  (t.chapters_total - le.progress) as chapters_remaining
from public.library_entries le
join public.titles t on le.title_id = t.id
where le.status = 'READING'
  and t.chapters_total > le.progress
order by le.last_read_at desc;

-- RPC for "Finish Quickly" (Identify titles closest to completion)
create or replace function public.get_finish_quickly(p_user_id uuid, p_limit integer default 5)
returns table (
  title_id uuid,
  title text,
  cover_url text,
  progress integer,
  chapters_total integer,
  percent_complete numeric
) 
language plpgsql
security definer
as $$
begin
  return query
  select 
    t.id,
    t.title_romaji,
    t.cover_url,
    le.progress,
    t.chapters_total,
    round((le.progress::numeric / t.chapters_total::numeric) * 100, 2) as percent_complete
  from public.library_entries le
  join public.titles t on le.title_id = t.id
  where le.user_id = p_user_id
    and le.status = 'READING'
    and t.chapters_total > 0
    and le.progress < t.chapters_total
  order by percent_complete desc
  limit p_limit;
end;
$$;

-- RPC for "Short Reads" (Suggest short series from planning/backlog)
create or replace function public.get_short_reads(p_user_id uuid, p_max_chapters integer default 30, p_limit integer default 5)
returns table (
  title_id uuid,
  title text,
  cover_url text,
  chapters_total integer,
  genres text[]
)
language plpgsql
security definer
as $$
begin
  return query
  select 
    t.id,
    t.title_romaji,
    t.cover_url,
    t.chapters_total,
    t.genres
  from public.library_entries le
  join public.titles t on le.title_id = t.id
  where le.user_id = p_user_id
    and le.status = 'PLANNING'
    and t.chapters_total > 0
    and t.chapters_total <= p_max_chapters
  order by t.popularity desc
  limit p_limit;
end;
$$;

-- Taste-based recommendations (Suggest titles in user's top genres they haven't read)
create or replace function public.get_taste_recommendations(p_user_id uuid, p_limit integer default 6)
returns table (
  title_id uuid,
  title text,
  cover_url text,
  genres text[],
  average_score numeric,
  popularity integer,
  reason text
)
language plpgsql
security definer
as $$
declare
  v_top_genres text[];
begin
  -- Identify user's top 3 genres from high-scored or completed library entries
  select array_agg(genre)
  into v_top_genres
  from (
    select unnest(t.genres) as genre
    from public.library_entries le
    join public.titles t on le.title_id = t.id
    where le.user_id = p_user_id
      and (le.score >= 8 or le.status = 'COMPLETED')
    group by genre
    order by count(*) desc
    limit 3
  ) g;

  return query
  select 
    t.id,
    t.title_romaji,
    t.cover_url,
    t.genres,
    t.average_score,
    t.popularity,
    'Based on your interest in ' || (select string_agg(g, ', ') from unnest(t.genres) as g where g = any(v_top_genres)) as reason
  from public.titles t
  where t.genres && v_top_genres
    and t.id not in (select title_id from public.library_entries where user_id = p_user_id)
  order by t.average_score desc, t.popularity desc
  limit p_limit;
end;
$$;

-- Starter Pack Recommendations (User-curated "must reads" for others)
-- This currently pulls from user's favorites, but can be manually pinned in future
create or replace function public.get_starter_pack(p_user_id uuid, p_limit integer default 4)
returns table (
  title_id uuid,
  title text,
  cover_url text,
  score integer,
  genres text[]
)
language plpgsql
security definer
as $$
begin
  return query
  select 
    t.id,
    t.title_romaji,
    t.cover_url,
    le.score,
    t.genres
  from public.library_entries le
  join public.titles t on le.title_id = t.id
  where le.user_id = p_user_id
    and (le.score >= 9 or le.is_favourite = true)
  order by le.score desc, t.popularity desc
  limit p_limit;
end;
$$;

-- Goal and Retention: Reading Streak & Progress
create or replace function public.get_reading_stats_and_goals(p_user_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_streak integer;
  v_monthly_chapters integer;
  v_target_chapters integer := 100; -- Default monthly goal
begin
  -- Calculate current daily streak (simplified)
  -- Real implementation would check audit logs for consecutive days of activity
  select count(*)
  into v_streak
  from (
    select distinct last_read_at::date
    from public.library_entries
    where user_id = p_user_id
      and last_read_at >= now() - interval '30 days'
  ) d;

  -- Chapters read this calendar month
  -- Assuming we have an audit log of progress updates, but here we estimate
  -- from updated titles this month for simplicity of this prototype
  select coalesce(sum(progress), 0)
  into v_monthly_chapters
  from public.library_entries
  where user_id = p_user_id
    and updated_at >= date_trunc('month', now());

  return jsonb_build_object(
    'current_streak', v_streak,
    'monthly_progress', v_monthly_chapters,
    'monthly_goal', v_target_chapters,
    'retention_score', round((v_streak::numeric / 30.0) * 100, 0)
  );
end;
$$;

