-- أجر المهندس يُحتسب فور إسناد العمل، لا بعد اكتماله.
-- المديونية = ما استلمه − أجور الأعمال غير الملغاة، فتُخصم الأجرة الجديدة مباشرة.

create or replace view public.engineer_balances as
select
  e.id as engineer_id,
  e.name,
  coalesce(x.earned, 0)::numeric as earned,
  coalesce(p.paid, 0)::numeric as paid,
  (coalesce(x.earned, 0) - coalesce(p.paid, 0))::numeric as balance
from public.engineers e
left join (
  select engineer_id, sum(engineer_fee) as earned
  from public.jobs
  where deleted_at is null
    and status <> 'cancelled'
    and engineer_id is not null
  group by engineer_id
) x on x.engineer_id = e.id
left join (
  select engineer_id, sum(amount) as paid
  from public.engineer_payments
  group by engineer_id
) p on p.engineer_id = e.id;

grant select on public.engineer_balances to authenticated;
