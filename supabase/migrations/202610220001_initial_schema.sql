-- ============================================================================
-- SMART-SUPERVISI: Skema Database & Storage Supabase Lengkap (Terkonsolidasi)
-- Kredensial Administrator Aplikasi:
-- Email: admin@supervisi.com
-- Password: adminsupervisi123
-- ============================================================================

create extension if not exists pgcrypto;

-- 1. Tabel Profil Administrator
create table if not exists public.admin_profiles (
  user_id uuid primary key default gen_random_uuid(),
  full_name text not null check (length(trim(full_name)) > 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2. Tabel Direktori Perawat
create table if not exists public.nurses (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (length(trim(full_name)) > 0),
  unit text not null check (length(trim(unit)) > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Tabel Agenda & Jadwal Supervisi
create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  scheduled_for date not null,
  unit text not null check (length(trim(unit)) > 0),
  target text not null check (length(trim(target)) > 0),
  note text not null default '',
  done_at timestamptz,
  linked_supervision_id uuid,
  created_by uuid,
  created_at timestamptz not null default now()
);

-- 4. Tabel Hasil Supervisi Klinis
create table if not exists public.supervisions (
  id uuid primary key default gen_random_uuid(),
  supervision_date date not null,
  nurse_id uuid not null references public.nurses (id) on delete cascade,
  unit text not null check (length(trim(unit)) > 0),
  supervisor text not null check (length(trim(supervisor)) > 0),
  parent_id uuid references public.supervisions (id) on delete set null,
  schedule_id uuid references public.schedules (id) on delete set null,
  conclusion jsonb not null default '{"ok":"","masalah":"","risiko":""}'::jsonb,
  causes jsonb not null default '{}'::jsonb,
  interventions text[] not null default '{}',
  fair jsonb not null default '{"F":"","A":"","I":"","R":"","review":""}'::jsonb,
  published boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now()
);

-- Menghapus perawat turut menghapus seluruh riwayat supervisinya.
alter table public.supervisions
  drop constraint if exists supervisions_nurse_id_fkey;

alter table public.supervisions
  add constraint supervisions_nurse_id_fkey
  foreign key (nurse_id)
  references public.nurses (id)
  on delete cascade;

-- Relasi Jadwal dengan Supervisi yang terlaksana
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'schedules_linked_supervision_fk'
  ) then
    alter table public.schedules
      add constraint schedules_linked_supervision_fk
      foreign key (linked_supervision_id) references public.supervisions (id) on delete set null;
  end if;
end $$;

-- 5. Tabel Rincian Skor Supervisi (8 Item Pasien Safety + 12 Item IV)
create table if not exists public.supervision_scores (
  supervision_id uuid not null references public.supervisions (id) on delete cascade,
  item_id text not null check (item_id in (
    'c1','c2','c3','c4','c5','c6','c7','c8',
    'iv1','iv2','iv3','iv4','iv5','iv6','iv7','iv8','iv9','iv10','iv11','iv12'
  )),
  score smallint,
  primary key (supervision_id, item_id),
  constraint supervision_scores_valid_value check (
    (score between 0 and 2) or (score is null and item_id like 'iv%')
  )
);

-- 6. Tabel Tindak Lanjut (RTL) Supervisi
create table if not exists public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  supervision_id uuid not null references public.supervisions (id) on delete cascade,
  item_id text check (item_id is null or item_id in (
    'c1','c2','c3','c4','c5','c6','c7','c8',
    'iv1','iv2','iv3','iv4','iv5','iv6','iv7','iv8','iv9','iv10','iv11','iv12'
  )),
  problem text not null,
  cause text not null default '',
  intervention text not null default '',
  pic text not null default '',
  target text not null default '',
  due_date date,
  evaluation text not null default '',
  status text not null default 'Belum ditindaklanjuti' check (status in (
    'Belum ditindaklanjuti','Sedang ditindaklanjuti','Sudah dilaksanakan',
    'Sudah dievaluasi','Masalah selesai','Membutuhkan intervensi lanjutan'
  )),
  created_at timestamptz not null default now()
);

-- 7. Tabel Dokumen SPO & Modul Keperawatan
create table if not exists public.sop_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) > 0),
  category text not null default 'Umum',
  description text not null default '',
  assessment_items jsonb not null default '[]'::jsonb,
  storage_path text not null unique,
  file_name text not null,
  file_size integer not null check (file_size between 1 and 3145728),
  updated_on date not null default current_date,
  published boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now()
);

alter table public.sop_documents
  add column if not exists assessment_items jsonb not null default '[]'::jsonb;

alter table public.supervisions
  add column if not exists module_id uuid references public.sop_documents (id) on delete set null;

-- Lepaskan relasi paksa ke auth.users jika skema lama sempat terpasang
alter table public.schedules alter column created_by drop not null;
alter table public.schedules drop constraint if exists schedules_created_by_fkey;

alter table public.supervisions alter column created_by drop not null;
alter table public.supervisions drop constraint if exists supervisions_created_by_fkey;

alter table public.sop_documents alter column created_by drop not null;
alter table public.sop_documents drop constraint if exists sop_documents_created_by_fkey;

-- 8. Indexes untuk Akses Cepat
create index if not exists supervisions_date_idx on public.supervisions (supervision_date desc);
create index if not exists supervisions_nurse_date_idx on public.supervisions (nurse_id, supervision_date desc);
create index if not exists supervisions_parent_idx on public.supervisions (parent_id) where parent_id is not null;
create index if not exists follow_ups_status_due_idx on public.follow_ups (status, due_date);
create index if not exists schedules_date_idx on public.schedules (scheduled_for);
create index if not exists sop_documents_published_idx on public.sop_documents (published, updated_on desc);

-- 9. Trigger Update Otomatis Timestamp Perawat
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists nurses_touch_updated_at on public.nurses;
create trigger nurses_touch_updated_at
before update on public.nurses
for each row execute function public.touch_updated_at();

-- 10. Fungsi Pemeriksa Akses Admin (Validasi admin dikelola di aplikasi)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select true;
$$;

-- 11. Row Level Security & Hak Akses Tabel
alter table public.admin_profiles enable row level security;
alter table public.nurses enable row level security;
alter table public.schedules enable row level security;
alter table public.supervisions enable row level security;
alter table public.supervision_scores enable row level security;
alter table public.follow_ups enable row level security;
alter table public.sop_documents enable row level security;

-- Hapus kebijakan RLS lama yang membatasi
drop policy if exists "Admins manage administrator profiles" on public.admin_profiles;
drop policy if exists "Admins manage nurses" on public.nurses;
drop policy if exists "Admins manage schedules" on public.schedules;
drop policy if exists "Admins manage supervisions" on public.supervisions;
drop policy if exists "Admins manage supervision scores" on public.supervision_scores;
drop policy if exists "Admins manage follow ups" on public.follow_ups;
drop policy if exists "Admins manage SOP documents" on public.sop_documents;
drop policy if exists "Allow all manage admin_profiles" on public.admin_profiles;
drop policy if exists "Allow all manage nurses" on public.nurses;
drop policy if exists "Allow all manage schedules" on public.schedules;
drop policy if exists "Allow all manage supervisions" on public.supervisions;
drop policy if exists "Allow all manage supervision scores" on public.supervision_scores;
drop policy if exists "Allow all manage follow ups" on public.follow_ups;
drop policy if exists "Allow all manage SOP documents" on public.sop_documents;

create policy "Allow all manage admin_profiles" on public.admin_profiles for all to anon, authenticated using (true) with check (true);
create policy "Allow all manage nurses" on public.nurses for all to anon, authenticated using (true) with check (true);
create policy "Allow all manage schedules" on public.schedules for all to anon, authenticated using (true) with check (true);
create policy "Allow all manage supervisions" on public.supervisions for all to anon, authenticated using (true) with check (true);
create policy "Allow all manage supervision scores" on public.supervision_scores for all to anon, authenticated using (true) with check (true);
create policy "Allow all manage follow ups" on public.follow_ups for all to anon, authenticated using (true) with check (true);
create policy "Allow all manage SOP documents" on public.sop_documents for all to anon, authenticated using (true) with check (true);

grant select, insert, update, delete on public.admin_profiles, public.nurses,
  public.schedules, public.supervisions, public.supervision_scores,
  public.follow_ups, public.sop_documents to anon, authenticated;

-- 12. RPC Ringkasan Data Publik (Untuk Tampilan Perawat / Mode Baca)
create or replace function public.get_public_overview()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'supervisions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id,
        'date', s.supervision_date,
        'nurse_id', s.nurse_id,
        'nurse', n.full_name,
        'unit', s.unit,
        'supervisor', s.supervisor,
        'parent_id', s.parent_id,
        'module_id', s.module_id,
        'module_title', selected_module.title,
        'conclusion', s.conclusion,
        'interventions', s.interventions,
        'fair', s.fair,
        'scores', coalesce((
          select jsonb_object_agg(sc.item_id, case when sc.score is null then '"na"'::jsonb else to_jsonb(sc.score) end)
          from public.supervision_scores sc where sc.supervision_id = s.id
        ), '{}'::jsonb),
        'causes', s.causes,
        'follow_ups', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', f.id, 'item_id', f.item_id, 'problem', f.problem, 'cause', f.cause,
            'intervention', f.intervention, 'pic', f.pic, 'target', f.target,
            'due_date', f.due_date, 'evaluation', f.evaluation, 'status', f.status
          ) order by f.due_date nulls last)
          from public.follow_ups f where f.supervision_id = s.id
        ), '[]'::jsonb)
      ) order by s.supervision_date desc)
      from public.supervisions s
      join public.nurses n on n.id = s.nurse_id
      left join public.sop_documents selected_module on selected_module.id = s.module_id
      where s.published
    ), '[]'::jsonb),
    'schedules', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', id, 'date', scheduled_for, 'unit', unit, 'target', target,
        'note', note, 'done', done_at is not null
      ) order by scheduled_for)
      from public.schedules
      where exists (
        select 1 from public.supervisions s
        where s.schedule_id = schedules.id and s.published
      )
    ), '[]'::jsonb),
    'sops', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', id, 'title', title, 'category', category, 'description', description,
        'file_name', file_name, 'file_size', file_size, 'updated_on', updated_on,
        'storage_path', storage_path, 'assessment_items', assessment_items
      ) order by updated_on desc)
      from public.sop_documents where published
    ), '[]'::jsonb)
  );
$$;

-- 13. Fungsi Validasi Baca Berkas Dokumen SPO
create or replace function public.can_read_sop_object(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select true;
$$;

-- 14. RPC Penyimpanan Transaksi Supervisi Klinis
create or replace function public.save_supervision(
  p_supervision jsonb,
  p_scores jsonb,
  p_follow_ups jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id uuid := gen_random_uuid();
  score_key text;
  score_value text;
  item_ids constant text[] := array[
    'c1','c2','c3','c4','c5','c6','c7','c8',
    'iv1','iv2','iv3','iv4','iv5','iv6','iv7','iv8','iv9','iv10','iv11','iv12'
  ];
  parent_value uuid;
  schedule_value uuid;
  module_value uuid;
  follow_up jsonb;
  creator_id uuid;
begin
  if jsonb_typeof(p_supervision) <> 'object'
    or jsonb_typeof(p_scores) <> 'object'
    or jsonb_typeof(p_follow_ups) <> 'array' then
    raise exception 'Format data supervisi tidak valid.';
  end if;
  if (select count(*) from jsonb_object_keys(p_scores)) <> 20 then
    raise exception 'Semua 20 item penilaian wajib dikirim.';
  end if;
  foreach score_key in array item_ids loop
    if not (p_scores ? score_key) then
      raise exception 'Penilaian item % belum tersedia.', score_key;
    end if;
    score_value := p_scores ->> score_key;
    if score_value not in ('0','1','2') and not (score_value = 'na' and score_key like 'iv%') then
      raise exception 'Nilai item % tidak valid.', score_key;
    end if;
  end loop;
  if nullif(trim(p_supervision ->> 'unit'), '') is null
    or nullif(trim(p_supervision ->> 'supervisor'), '') is null
    or nullif(p_supervision ->> 'nurse_id', '') is null
    or nullif(p_supervision ->> 'date', '') is null then
    raise exception 'Tanggal, unit, supervisor, dan perawat wajib diisi.';
  end if;
  if jsonb_typeof(coalesce(p_supervision -> 'conclusion', '{}'::jsonb)) <> 'object'
    or jsonb_typeof(coalesce(p_supervision -> 'causes', '{}'::jsonb)) <> 'object'
    or jsonb_typeof(coalesce(p_supervision -> 'interventions', '[]'::jsonb)) <> 'array'
    or jsonb_typeof(coalesce(p_supervision -> 'fair', '{}'::jsonb)) <> 'object' then
    raise exception 'Format kesimpulan, penyebab, intervensi, atau FAIR tidak valid.';
  end if;

  parent_value := nullif(p_supervision ->> 'parent_id', '')::uuid;
  schedule_value := nullif(p_supervision ->> 'schedule_id', '')::uuid;
  module_value := nullif(p_supervision ->> 'module_id', '')::uuid;
  if module_value is null or not exists (
    select 1 from public.sop_documents
    where id = module_value
  ) then
    raise exception 'SOP atau modul supervisi wajib dipilih dari dokumen yang sudah diunggah.';
  end if;
  if not exists (
    select 1 from public.nurses
    where id = (p_supervision ->> 'nurse_id')::uuid and active
  ) then
    raise exception 'Perawat tidak ditemukan atau sudah dinonaktifkan.';
  end if;
  if parent_value is not null and not exists (
    select 1 from public.supervisions
    where id = parent_value and nurse_id = (p_supervision ->> 'nurse_id')::uuid
  ) then
    raise exception 'Supervisi induk tidak ditemukan untuk perawat ini.';
  end if;
  if schedule_value is not null and not exists (
    select 1 from public.schedules where id = schedule_value and done_at is null
  ) then
    raise exception 'Jadwal tidak ditemukan atau sudah diselesaikan.';
  end if;

  creator_id := coalesce((select auth.uid()), nullif(p_supervision ->> 'created_by', '')::uuid);

  insert into public.supervisions (
    id, supervision_date, nurse_id, unit, supervisor, parent_id, schedule_id, module_id,
    conclusion, causes, interventions, fair, created_by
  ) values (
    new_id,
    (p_supervision ->> 'date')::date,
    (p_supervision ->> 'nurse_id')::uuid,
    trim(p_supervision ->> 'unit'),
    trim(p_supervision ->> 'supervisor'),
    parent_value,
    schedule_value,
    module_value,
    coalesce(p_supervision -> 'conclusion', '{}'::jsonb),
    coalesce(p_supervision -> 'causes', '{}'::jsonb),
    coalesce(array(select jsonb_array_elements_text(coalesce(p_supervision -> 'interventions', '[]'::jsonb))), '{}'),
    coalesce(p_supervision -> 'fair', '{}'::jsonb),
    creator_id
  );

  for score_key, score_value in select key, value from jsonb_each_text(p_scores) loop
    insert into public.supervision_scores (supervision_id, item_id, score)
    values (new_id, score_key, case when score_value = 'na' then null else score_value::smallint end);
  end loop;

  for follow_up in select value from jsonb_array_elements(p_follow_ups) loop
    if nullif(trim(follow_up ->> 'problem'), '') is null then
      raise exception 'Uraian masalah RTL wajib diisi.';
    end if;
    insert into public.follow_ups (
      supervision_id, item_id, problem, cause, intervention, pic, target,
      due_date, evaluation, status
    ) values (
      new_id, nullif(follow_up ->> 'item_id', ''),
      trim(follow_up ->> 'problem'), coalesce(follow_up ->> 'cause', ''),
      coalesce(follow_up ->> 'intervention', ''), coalesce(follow_up ->> 'pic', ''),
      coalesce(follow_up ->> 'target', ''),
      nullif(follow_up ->> 'due_date', '')::date,
      coalesce(follow_up ->> 'evaluation', ''),
      coalesce(follow_up ->> 'status', 'Belum ditindaklanjuti')
    );
  end loop;

  if parent_value is not null then
    update public.follow_ups f
    set status = case when sc.score = 2 then 'Masalah selesai' else 'Membutuhkan intervensi lanjutan' end
    from public.supervision_scores sc
    where f.supervision_id = parent_value
      and f.item_id = sc.item_id
      and sc.supervision_id = new_id
      and sc.score is not null
      and f.status <> 'Masalah selesai';
  end if;

  if schedule_value is not null then
    update public.schedules set done_at = now(), linked_supervision_id = new_id
    where id = schedule_value;
  end if;

  return new_id;
end;
$$;

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.get_public_overview() to anon, authenticated;
grant execute on function public.can_read_sop_object(text) to anon, authenticated;
grant execute on function public.save_supervision(jsonb, jsonb, jsonb) to anon, authenticated;

-- 15. Storage Bucket & Kebijakan Berkas PDF Privat (supervisi-private)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('supervisi-private', 'supervisi-private', false, 3145728, array['application/pdf'])
on conflict (id) do update set public = false, file_size_limit = 3145728,
  allowed_mime_types = array['application/pdf'];

drop policy if exists "Admins upload SOP PDFs" on storage.objects;
drop policy if exists "Admins update SOP PDFs" on storage.objects;
drop policy if exists "Admins delete SOP PDFs" on storage.objects;
drop policy if exists "Read published SOP PDFs" on storage.objects;

create policy "Admins upload SOP PDFs" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'supervisi-private');

create policy "Admins update SOP PDFs" on storage.objects
  for update to anon, authenticated
  using (bucket_id = 'supervisi-private')
  with check (bucket_id = 'supervisi-private');

create policy "Admins delete SOP PDFs" on storage.objects
  for delete to anon, authenticated
  using (bucket_id = 'supervisi-private');

create policy "Read published SOP PDFs" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'supervisi-private');

-- 16. Checklist Observasi Dinamis dari SOP
alter table public.supervisions
  add column if not exists assessment_items jsonb not null default '[]'::jsonb,
  add column if not exists assessment_scores jsonb not null default '{}'::jsonb;

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select conname
    from pg_constraint
    where conrelid = 'public.follow_ups'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%item_id%'
  loop
    execute format('alter table public.follow_ups drop constraint %I', constraint_name);
  end loop;
end $$;

create or replace function public.get_public_overview()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'supervisions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id,
        'date', s.supervision_date,
        'nurse_id', s.nurse_id,
        'nurse', n.full_name,
        'unit', s.unit,
        'supervisor', s.supervisor,
        'parent_id', s.parent_id,
        'module_id', s.module_id,
        'module_title', selected_module.title,
        'assessment_items', s.assessment_items,
        'conclusion', s.conclusion,
        'interventions', s.interventions,
        'fair', s.fair,
        'scores', case
          when s.assessment_scores <> '{}'::jsonb then s.assessment_scores
          else coalesce((
            select jsonb_object_agg(sc.item_id, case when sc.score is null then '"na"'::jsonb else to_jsonb(sc.score) end)
            from public.supervision_scores sc where sc.supervision_id = s.id
          ), '{}'::jsonb)
        end,
        'causes', s.causes,
        'follow_ups', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', f.id, 'item_id', f.item_id, 'problem', f.problem, 'cause', f.cause,
            'intervention', f.intervention, 'pic', f.pic, 'target', f.target,
            'due_date', f.due_date, 'evaluation', f.evaluation, 'status', f.status
          ) order by f.due_date nulls last)
          from public.follow_ups f where f.supervision_id = s.id
        ), '[]'::jsonb)
      ) order by s.supervision_date desc)
      from public.supervisions s
      join public.nurses n on n.id = s.nurse_id
      left join public.sop_documents selected_module on selected_module.id = s.module_id
      where s.published
    ), '[]'::jsonb),
    'schedules', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', id, 'date', scheduled_for, 'unit', unit, 'target', target,
        'note', note, 'done', done_at is not null
      ) order by scheduled_for)
      from public.schedules
      where exists (
        select 1 from public.supervisions s
        where s.schedule_id = schedules.id and s.published
      )
    ), '[]'::jsonb),
    'sops', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', id, 'title', title, 'category', category, 'description', description,
        'file_name', file_name, 'file_size', file_size, 'updated_on', updated_on,
        'storage_path', storage_path, 'assessment_items', assessment_items
      ) order by updated_on desc)
      from public.sop_documents where published
    ), '[]'::jsonb)
  );
$$;

create or replace function public.save_supervision(
  p_supervision jsonb,
  p_scores jsonb,
  p_follow_ups jsonb,
  p_assessment_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id uuid := gen_random_uuid();
  assessment_item jsonb;
  score_key text;
  score_value text;
  item_id text;
  parent_value uuid;
  schedule_value uuid;
  module_value uuid;
  follow_up jsonb;
  creator_id uuid;
  item_count integer;
begin
  if jsonb_typeof(p_supervision) is distinct from 'object'
    or jsonb_typeof(p_scores) is distinct from 'object'
    or jsonb_typeof(p_follow_ups) is distinct from 'array'
    or jsonb_typeof(p_assessment_items) is distinct from 'array' then
    raise exception 'Format data supervisi atau checklist SOP tidak valid.';
  end if;

  item_count := jsonb_array_length(p_assessment_items);
  if item_count < 1 or item_count > 50
    or (select count(distinct value ->> 'id') from jsonb_array_elements(p_assessment_items)) <> item_count
    or (select count(*) from jsonb_object_keys(p_scores)) <> item_count then
    raise exception 'Checklist harus berisi 1 sampai 50 butir unik dengan skor lengkap.';
  end if;

  for assessment_item in select value from jsonb_array_elements(p_assessment_items) loop
    item_id := nullif(trim(assessment_item ->> 'id'), '');
    if item_id is null or nullif(trim(assessment_item ->> 'title'), '') is null
      or not (p_scores ? item_id) then
      raise exception 'Setiap butir checklist harus memiliki ID, uraian, dan skor.';
    end if;
    score_value := p_scores ->> item_id;
    if score_value not in ('0', '1', '2', 'na') then
      raise exception 'Nilai item % tidak valid.', item_id;
    end if;
  end loop;

  for score_key in select key from jsonb_each(p_scores) loop
    if not exists (
      select 1 from jsonb_array_elements(p_assessment_items) item
      where item ->> 'id' = score_key
    ) then
      raise exception 'Skor dikirim untuk butir yang tidak ada pada checklist.';
    end if;
  end loop;

  if nullif(trim(p_supervision ->> 'unit'), '') is null
    or nullif(trim(p_supervision ->> 'supervisor'), '') is null
    or nullif(p_supervision ->> 'nurse_id', '') is null
    or nullif(p_supervision ->> 'date', '') is null then
    raise exception 'Tanggal, unit, supervisor, dan perawat wajib diisi.';
  end if;
  if jsonb_typeof(coalesce(p_supervision -> 'conclusion', '{}'::jsonb)) <> 'object'
    or jsonb_typeof(coalesce(p_supervision -> 'causes', '{}'::jsonb)) <> 'object'
    or jsonb_typeof(coalesce(p_supervision -> 'interventions', '[]'::jsonb)) <> 'array'
    or jsonb_typeof(coalesce(p_supervision -> 'fair', '{}'::jsonb)) <> 'object' then
    raise exception 'Format kesimpulan, penyebab, intervensi, atau FAIR tidak valid.';
  end if;
  parent_value := nullif(p_supervision ->> 'parent_id', '')::uuid;
  schedule_value := nullif(p_supervision ->> 'schedule_id', '')::uuid;
  module_value := nullif(p_supervision ->> 'module_id', '')::uuid;
  if module_value is null or not exists (
    select 1 from public.sop_documents
    where id = module_value
      and case
        when jsonb_typeof(assessment_items) = 'array' then jsonb_array_length(assessment_items) > 0
        else false
      end
  ) then
    raise exception 'SOP atau modul yang dipilih belum memiliki checklist yang disetujui.';
  end if;
  if p_assessment_items <> (
    select assessment_items from public.sop_documents where id = module_value
  ) then
    raise exception 'Checklist supervisi tidak sesuai dengan checklist SOP yang disetujui.';
  end if;
  if not exists (
    select 1 from public.nurses
    where id = (p_supervision ->> 'nurse_id')::uuid and active
  ) then
    raise exception 'Perawat tidak ditemukan atau sudah dinonaktifkan.';
  end if;
  if parent_value is not null and not exists (
    select 1 from public.supervisions
    where id = parent_value and nurse_id = (p_supervision ->> 'nurse_id')::uuid
  ) then
    raise exception 'Supervisi induk tidak ditemukan untuk perawat ini.';
  end if;
  if schedule_value is not null and not exists (
    select 1 from public.schedules where id = schedule_value and done_at is null
  ) then
    raise exception 'Jadwal tidak ditemukan atau sudah diselesaikan.';
  end if;

  creator_id := coalesce((select auth.uid()), nullif(p_supervision ->> 'created_by', '')::uuid);

  insert into public.supervisions (
    id, supervision_date, nurse_id, unit, supervisor, parent_id, schedule_id, module_id,
    assessment_items, assessment_scores, conclusion, causes, interventions, fair, created_by
  ) values (
    new_id,
    (p_supervision ->> 'date')::date,
    (p_supervision ->> 'nurse_id')::uuid,
    trim(p_supervision ->> 'unit'),
    trim(p_supervision ->> 'supervisor'),
    parent_value,
    schedule_value,
    module_value,
    p_assessment_items,
    p_scores,
    coalesce(p_supervision -> 'conclusion', '{}'::jsonb),
    coalesce(p_supervision -> 'causes', '{}'::jsonb),
    coalesce(array(select jsonb_array_elements_text(coalesce(p_supervision -> 'interventions', '[]'::jsonb))), '{}'),
    coalesce(p_supervision -> 'fair', '{}'::jsonb),
    creator_id
  );

  for follow_up in select value from jsonb_array_elements(p_follow_ups) loop
    if nullif(trim(follow_up ->> 'problem'), '') is null then
      raise exception 'Uraian masalah RTL wajib diisi.';
    end if;
    insert into public.follow_ups (
      supervision_id, item_id, problem, cause, intervention, pic, target,
      due_date, evaluation, status
    ) values (
      new_id, nullif(follow_up ->> 'item_id', ''),
      trim(follow_up ->> 'problem'), coalesce(follow_up ->> 'cause', ''),
      coalesce(follow_up ->> 'intervention', ''), coalesce(follow_up ->> 'pic', ''),
      coalesce(follow_up ->> 'target', ''),
      nullif(follow_up ->> 'due_date', '')::date,
      coalesce(follow_up ->> 'evaluation', ''),
      coalesce(follow_up ->> 'status', 'Belum ditindaklanjuti')
    );
  end loop;

  if parent_value is not null then
    update public.follow_ups f
    set status = case when p_scores ->> f.item_id = '2'
      then 'Masalah selesai' else 'Membutuhkan intervensi lanjutan' end
    where f.supervision_id = parent_value
      and f.item_id is not null
      and p_scores ? f.item_id
      and f.status <> 'Masalah selesai';
  end if;

  if schedule_value is not null then
    update public.schedules set done_at = now(), linked_supervision_id = new_id
    where id = schedule_value;
  end if;

  return new_id;
end;
$$;

grant execute on function public.get_public_overview() to anon, authenticated;
grant execute on function public.save_supervision(jsonb, jsonb, jsonb, jsonb) to anon, authenticated;
