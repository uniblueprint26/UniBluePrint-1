-- Performance advisor fix: unindexed_foreign_keys (122 findings).
-- Every public-schema FK constraint without a covering leading index gets
-- a plain btree index on its FK column(s), named idx_<table>_<col[_col...]>.
-- Non-concurrent CREATE INDEX is fine here (pre-launch, low row counts);
-- IF NOT EXISTS makes this safe to re-run.

do $$
declare
  r record;
begin
  for r in
    with fk as (
      select
        c.oid as conoid,
        c.conrelid,
        array_agg(a.attname order by k.ord) as cols,
        array_agg(k.attnum order by k.ord) as attnums
      from pg_constraint c
      join lateral unnest(c.conkey) with ordinality as k(attnum, ord) on true
      join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum
      join pg_namespace n on n.oid = c.connamespace
      where c.contype = 'f' and n.nspname = 'public'
      group by c.oid, c.conrelid
    ),
    covered as (
      select fk.conoid
      from fk
      where exists (
        select 1 from pg_index i
        where i.indrelid = fk.conrelid
          and (i.indkey::int2[])[0:array_length(fk.attnums,1)-1] = fk.attnums::int2[]
      )
    )
    select
      format(
        'create index if not exists %I on public.%I (%s)',
        'idx_' || fk.conrelid::regclass::text || '_' || array_to_string(fk.cols, '_'),
        fk.conrelid::regclass::text,
        (select string_agg(quote_ident(c), ', ') from unnest(fk.cols) as c)
      ) as stmt
    from fk
    where fk.conoid not in (select conoid from covered)
  loop
    execute r.stmt;
  end loop;
end $$;
