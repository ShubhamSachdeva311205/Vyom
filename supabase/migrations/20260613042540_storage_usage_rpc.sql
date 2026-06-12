-- Storage usage per bucket for the admin usage dashboard (#129). The storage
-- schema isn't exposed via PostgREST, so a SECURITY DEFINER RPC reads it.
-- service_role only (the admin action calls it via the service client and
-- gates on assertAdmin() first).
create or replace function public.get_storage_usage()
returns table (bucket text, object_count bigint, total_bytes bigint)
language sql
security definer
set search_path = public, storage
as $$
  select bucket_id::text, count(*)::bigint,
         coalesce(sum((metadata->>'size')::bigint), 0)::bigint
  from storage.objects
  group by bucket_id;
$$;

revoke execute on function public.get_storage_usage() from public, anon, authenticated;
grant execute on function public.get_storage_usage() to service_role;
