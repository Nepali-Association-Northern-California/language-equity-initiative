-- =====================================================================
-- NANC survey database (Supabase / PostgreSQL)
-- Run the whole file in the Supabase SQL Editor. Safe to run more than once.
--
-- Access model
--   anon (public survey page)  : INSERT responses and contacts. Nothing else.
--   reviewer                   : aggregate dashboards and de-identified responses
--                                (free-text "Other" answers removed) via fetch_responses().
--   manager                    : everything a reviewer can do, full answers,
--                                exclude/include responses, focus groups, translations.
--   admin                      : everything, plus users, names (contacts), settings, audit log,
--                                deleting responses.
-- A person who signs up gets a profile with no role ("pending") until an admin assigns one.
-- =====================================================================

-- ---------------------------------------------------------------- survey data
create table if not exists public.responses (
  id              uuid primary key,
  survey_version  text        not null,
  language        text        not null check (language in ('en', 'ne')),
  mode            text        not null default 'self' check (mode in ('self', 'in_person', 'phone', 'paper')),
  volunteer_code  text,
  started_at      timestamptz,
  submitted_at    timestamptz not null default now(),
  received_at     timestamptz not null default now(),
  answers         jsonb       not null
);
alter table public.responses add column if not exists excluded       boolean not null default false;
alter table public.responses add column if not exists exclude_reason text;
-- Active time on the survey (seconds). Counts only while the page is on screen and in use.
alter table public.responses add column if not exists duration_seconds integer check (duration_seconds between 0 and 86400);
-- Active seconds per page, keyed by section id, e.g. {"consent": 40, "about": 180, ...}
alter table public.responses add column if not exists section_seconds jsonb;
create index if not exists responses_submitted_at_idx on public.responses (submitted_at);

-- Names are kept apart from answers. Only admins can read this table.
create table if not exists public.contacts (
  response_id  uuid primary key references public.responses(id) on delete cascade,
  first_name   text,
  last_name    text,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------- staff profiles
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  role        text check (role in ('reviewer', 'manager', 'admin')),   -- null = pending approval
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Role of the signed-in user, or null. SECURITY DEFINER so policies can call it without recursion.
create or replace function public.app_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and active
$$;

create or replace function public.has_role(min_role text)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    array_position(array['reviewer','manager','admin'], public.app_role())
      >= array_position(array['reviewer','manager','admin'], min_role),
    false)
$$;

-- New sign-ups get a pending profile automatically.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill users created before this script ran.
insert into public.profiles (id, email)
select u.id, u.email from auth.users u
on conflict (id) do nothing;

-- Migrate the earlier "staff" table, if it exists, then remove it.
do $$
begin
  if to_regclass('public.staff') is not null then
    update public.profiles p set role = s.role from public.staff s where s.user_id = p.id and p.role is null;
    drop policy if exists "staff read responses" on public.responses;
    drop policy if exists "admins read contacts" on public.contacts;
    drop table public.staff cascade;
  end if;
end $$;

-- ---------------------------------------------------------------- program activities
create table if not exists public.focus_groups (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  session_date  date,
  location      text,
  language      text not null default 'ne' check (language in ('ne', 'en', 'mixed')),
  facilitator   text,
  topic         text,
  status        text not null default 'planned' check (status in ('planned', 'completed', 'cancelled')),
  participants  integer check (participants >= 0),
  summary       text,
  themes        text[] not null default '{}',
  created_by    uuid default auth.uid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.translation_requests (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  topic           text,            -- option code from survey question L9
  partner         text,
  priority        text not null default 'medium' check (priority in ('high', 'medium', 'low')),
  status          text not null default 'requested'
                  check (status in ('requested', 'translating', 'review', 'approved', 'published')),
  translator      text,
  reviewer        text,
  due_date        date,
  source_url      text,
  translated_url  text,
  notes           text,
  created_by      uuid default auth.uid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.glossary (
  id          uuid primary key default gen_random_uuid(),
  term_en     text not null unique,
  term_ne     text not null,
  notes       text,
  created_at  timestamptz not null default now()
);

create table if not exists public.settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);
insert into public.settings (key, value) values
  ('target_responses', '300'),
  ('program_start', '"2026-10-01"'),
  ('program_end', '"2027-08-31"')
on conflict (key) do nothing;

create table if not exists public.audit_log (
  id       bigserial primary key,
  at       timestamptz not null default now(),
  user_id  uuid default auth.uid(),
  email    text,
  action   text not null,
  target   text,
  details  jsonb
);

-- keep updated_at current
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
drop trigger if exists touch_profiles on public.profiles;
create trigger touch_profiles before update on public.profiles for each row execute function public.touch_updated_at();
drop trigger if exists touch_focus_groups on public.focus_groups;
create trigger touch_focus_groups before update on public.focus_groups for each row execute function public.touch_updated_at();
drop trigger if exists touch_translations on public.translation_requests;
create trigger touch_translations before update on public.translation_requests for each row execute function public.touch_updated_at();

-- Record role and access changes automatically.
create or replace function public.audit_profile_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role or new.active is distinct from old.active then
    insert into public.audit_log (user_id, email, action, target, details)
    values (auth.uid(), (select email from public.profiles where id = auth.uid()), 'user.update', new.email,
            jsonb_build_object('role_from', old.role, 'role_to', new.role, 'active_from', old.active, 'active_to', new.active));
  end if;
  return new;
end $$;
drop trigger if exists audit_profiles on public.profiles;
create trigger audit_profiles after update on public.profiles for each row execute function public.audit_profile_change();

-- ---------------------------------------------------------------- row-level security
alter table public.responses            enable row level security;
alter table public.contacts             enable row level security;
alter table public.profiles             enable row level security;
alter table public.focus_groups         enable row level security;
alter table public.translation_requests enable row level security;
alter table public.glossary             enable row level security;
alter table public.settings             enable row level security;
alter table public.audit_log            enable row level security;

-- Table privileges (new Supabase projects do not grant these automatically).
grant usage on schema public to anon, authenticated;
revoke all on public.responses, public.contacts, public.profiles, public.focus_groups,
              public.translation_requests, public.glossary, public.settings, public.audit_log from anon;
grant insert on public.responses, public.contacts to anon;

revoke all on public.responses, public.contacts, public.profiles from authenticated;
grant select, delete on public.responses to authenticated;
grant update (excluded, exclude_reason) on public.responses to authenticated;
grant select, delete on public.contacts to authenticated;
grant select on public.profiles to authenticated;
grant update (role, active, full_name) on public.profiles to authenticated;
grant select, insert, update, delete on public.focus_groups, public.translation_requests, public.glossary to authenticated;
grant select, insert, update on public.settings to authenticated;
grant select, insert on public.audit_log to authenticated;
grant usage on sequence public.audit_log_id_seq to authenticated;

-- responses
drop policy if exists "public can submit responses" on public.responses;
create policy "public can submit responses" on public.responses for insert to anon with check (true);
drop policy if exists "managers read responses" on public.responses;
create policy "managers read responses" on public.responses for select to authenticated using (public.has_role('manager'));
drop policy if exists "managers flag responses" on public.responses;
create policy "managers flag responses" on public.responses for update to authenticated
  using (public.has_role('manager')) with check (public.has_role('manager'));
drop policy if exists "admins delete responses" on public.responses;
create policy "admins delete responses" on public.responses for delete to authenticated using (public.has_role('admin'));

-- contacts (names)
drop policy if exists "public can submit contacts" on public.contacts;
create policy "public can submit contacts" on public.contacts for insert to anon with check (true);
drop policy if exists "admins read contacts" on public.contacts;
create policy "admins read contacts" on public.contacts for select to authenticated using (public.has_role('admin'));
drop policy if exists "admins delete contacts" on public.contacts;
create policy "admins delete contacts" on public.contacts for delete to authenticated using (public.has_role('admin'));

-- profiles
drop policy if exists "read own or admin reads all" on public.profiles;
create policy "read own or admin reads all" on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_role('admin'));
drop policy if exists "admins manage profiles" on public.profiles;
create policy "admins manage profiles" on public.profiles for update to authenticated
  using (public.has_role('admin')) with check (public.has_role('admin'));

-- focus groups, translations, glossary: all staff read, managers edit
drop policy if exists "staff read focus groups" on public.focus_groups;
create policy "staff read focus groups" on public.focus_groups for select to authenticated using (public.has_role('reviewer'));
drop policy if exists "managers edit focus groups" on public.focus_groups;
create policy "managers edit focus groups" on public.focus_groups for all to authenticated
  using (public.has_role('manager')) with check (public.has_role('manager'));

drop policy if exists "staff read translations" on public.translation_requests;
create policy "staff read translations" on public.translation_requests for select to authenticated using (public.has_role('reviewer'));
drop policy if exists "managers edit translations" on public.translation_requests;
create policy "managers edit translations" on public.translation_requests for all to authenticated
  using (public.has_role('manager')) with check (public.has_role('manager'));

drop policy if exists "staff read glossary" on public.glossary;
create policy "staff read glossary" on public.glossary for select to authenticated using (public.has_role('reviewer'));
drop policy if exists "managers edit glossary" on public.glossary;
create policy "managers edit glossary" on public.glossary for all to authenticated
  using (public.has_role('manager')) with check (public.has_role('manager'));

-- settings: staff read, admins write
drop policy if exists "staff read settings" on public.settings;
create policy "staff read settings" on public.settings for select to authenticated using (public.has_role('reviewer'));
drop policy if exists "admins write settings" on public.settings;
create policy "admins write settings" on public.settings for all to authenticated
  using (public.has_role('admin')) with check (public.has_role('admin'));

-- audit log: staff write their own entries, admins read
drop policy if exists "staff write audit" on public.audit_log;
create policy "staff write audit" on public.audit_log for insert to authenticated
  with check (public.has_role('reviewer') and user_id = auth.uid());
drop policy if exists "admins read audit" on public.audit_log;
create policy "admins read audit" on public.audit_log for select to authenticated using (public.has_role('admin'));

-- ---------------------------------------------------------------- read API for dashboards
-- All staff read responses through this function. Reviewers get free-text "Other" answers
-- and volunteer names removed; managers and admins get everything.
drop function if exists public.fetch_responses();   -- return columns changed; recreate
create function public.fetch_responses()
returns table (
  id uuid, survey_version text, language text, mode text, volunteer_code text,
  started_at timestamptz, submitted_at timestamptz, duration_seconds integer, section_seconds jsonb,
  excluded boolean, exclude_reason text, answers jsonb
)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare r text := public.app_role();
begin
  if r is null then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  return query
    select x.id, x.survey_version, x.language, x.mode,
           case when r = 'reviewer' then null else x.volunteer_code end,
           x.started_at, x.submitted_at, x.duration_seconds, x.section_seconds, x.excluded, x.exclude_reason,
           case when r = 'reviewer'
                then (select coalesce(jsonb_object_agg(e.k, e.v), '{}'::jsonb)
                        from jsonb_each(x.answers) as e(k, v) where right(e.k, 6) <> '_other')
                else x.answers end
    from public.responses x
    order by x.submitted_at, x.id;
end $$;

revoke all on function public.fetch_responses() from public, anon;
grant execute on function public.fetch_responses() to authenticated;
grant execute on function public.app_role(), public.has_role(text) to authenticated;

-- Flattened view (managers/admins): one row per response and multi-select option.
create or replace view public.response_choices with (security_invoker = true) as
select r.id as response_id, r.language, r.mode, r.answers->>'D2' as city, r.answers->>'D3' as age_group,
       q.key as question, jsonb_array_elements_text(q.value) as choice
from public.responses r, jsonb_each(r.answers) q
where jsonb_typeof(q.value) = 'array';
grant select on public.response_choices to authenticated;

-- ---------------------------------------------------------------- first admin
-- After you sign up on the staff page, make yourself admin (replace the email):
--   update public.profiles set role = 'admin' where email = 'you@example.org';
