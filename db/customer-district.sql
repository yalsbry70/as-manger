-- أضف عمود الحي لجدول العملاء. نفّذه مرة واحدة في محرر SQL في Supabase.

alter table public.customers
  add column if not exists district text;
