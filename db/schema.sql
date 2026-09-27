-- NANC survey database (Supabase / PostgreSQL).
-- Run in the Supabase SQL editor. The public survey page uses the anon key and can only INSERT.
-- Reviewers sign in (Supabase Auth) and are granted read access through the staff table.

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

-- Names are kept apart from answers. Only admins can read this table. Delete it when focus groups end.
create table if not exists public.contacts (
  response_id  uuid primary key references public.responses(id) on delete cascade,
  first_name   text,
  last_name    text,
  created_at   timestamptz not null default now()
);

create table if not exists public.staff (
  user_id  uuid primary key references auth.users(id) on delete cascade,
  role     text not null check (role in ('reviewer', 'manager', 'admin'))
);

alter table public.responses enable row level security;
alter table public.contacts  enable row level security;
alter table public.staff     enable row level security;

-- Public survey: insert only, never read.
create policy "public can submit responses" on public.responses
  for insert to anon with check (true);
create policy "public can submit contacts" on public.contacts
  for insert to anon with check (true);

-- Staff can read responses; only admins can read contacts.
create policy "staff read responses" on public.responses
  for select to authenticated
  using (exists (select 1 from public.staff s where s.user_id = auth.uid()));
create policy "admins read contacts" on public.contacts
  for select to authenticated
  using (exists (select 1 from public.staff s where s.user_id = auth.uid() and s.role = 'admin'));
create policy "staff see own role" on public.staff
  for select to authenticated using (user_id = auth.uid());

-- Flattened view for dashboards and Excel export: one row per response and multi-select option.
create or replace view public.response_choices with (security_invoker = true) as
select r.id as response_id, r.language, r.mode, r.answers->>'D2' as city, r.answers->>'D3' as age_group,
       q.key as question, jsonb_array_elements_text(q.value) as choice
from public.responses r, jsonb_each(r.answers) q
where jsonb_typeof(q.value) = 'array';
