-- قوائم ثابتة للشركة ونوع المكيف. تُنفَّذ مرة واحدة في محرر SQL في Supabase.

create table if not exists public.brands (
  id bigint generated always as identity primary key,
  name text not null unique,
  sort int not null default 0
);

create table if not exists public.ac_types (
  id bigint generated always as identity primary key,
  name text not null unique,
  sort int not null default 0
);

alter table public.brands enable row level security;
alter table public.ac_types enable row level security;

grant select on public.brands to authenticated;
grant select on public.ac_types to authenticated;

drop policy if exists "read brands" on public.brands;
create policy "read brands" on public.brands
  for select to authenticated using (true);

drop policy if exists "read types" on public.ac_types;
create policy "read types" on public.ac_types
  for select to authenticated using (true);

insert into public.brands (name, sort) values
  ('جري', 10),
  ('إل جي', 20),
  ('سامسونج', 30),
  ('ميديا', 40),
  ('كارير', 50),
  ('أو جنرال', 60),
  ('جنرال', 70),
  ('هايسنس', 80),
  ('شارب', 90),
  ('هاير', 100),
  ('توشيبا', 110),
  ('هيتاشي', 120),
  ('دايكن', 130),
  ('ترين', 140),
  ('يورك', 150),
  ('باناسونيك', 160),
  ('ميتسوبيشي', 170),
  ('فوجيتسو', 180),
  ('وايت ويل', 190),
  ('سوبر جنرال', 200),
  ('أكسن', 210),
  ('نيكاي', 220),
  ('جولدي', 230),
  ('فريش', 240),
  ('زامل', 250)
on conflict (name) do nothing;

insert into public.ac_types (name, sort) values
  ('سبليت', 10),
  ('شباك', 20),
  ('دولابي', 30),
  ('كاسيت', 40),
  ('مخفي', 50),
  ('مركزي', 60),
  ('باكج', 70),
  ('صحراوي', 80),
  ('متنقل', 90)
on conflict (name) do nothing;

insert into public.brands (name, sort)
select distinct btrim(brand), 1000
from public.jobs
where brand is not null and btrim(brand) <> ''
on conflict (name) do nothing;

insert into public.ac_types (name, sort)
select distinct btrim(ac_type), 1000
from public.jobs
where ac_type is not null and btrim(ac_type) <> ''
on conflict (name) do nothing;

create or replace function public.enforce_ac_catalog()
returns trigger
language plpgsql
as $$
begin
  new.brand := nullif(btrim(new.brand), '');
  new.ac_type := nullif(btrim(new.ac_type), '');

  if new.brand is not null and not exists (select 1 from public.brands where name = new.brand) then
    raise exception 'الشركة غير موجودة في القائمة الثابتة';
  end if;

  if new.ac_type is not null and not exists (select 1 from public.ac_types where name = new.ac_type) then
    raise exception 'النوع غير موجود في القائمة الثابتة';
  end if;

  return new;
end;
$$;

drop trigger if exists jobs_catalog on public.jobs;
create trigger jobs_catalog
  before insert or update on public.jobs
  for each row execute function public.enforce_ac_catalog();
