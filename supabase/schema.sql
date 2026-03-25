create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  room text,
  schedule_text text,
  expected_students integer not null default 0,
  color_start text not null default '#6366f1',
  color_end text not null default '#7c3aed',
  allowed_wifi_name text,
  allowed_wifi_public_ip text,
  allowed_latitude float8,
  allowed_longitude float8,
  allowed_radius integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.classes
  add column if not exists allowed_wifi_name text;

alter table public.classes
  add column if not exists allowed_wifi_public_ip text;

alter table public.classes
  add column if not exists allowed_latitude float8;

alter table public.classes
  add column if not exists allowed_longitude float8;

alter table public.classes
  add column if not exists allowed_radius integer; -- in meters

create table if not exists public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  session_date date not null,
  source_file_name text,
  upload_count integer not null default 0,
  review_status text not null default 'draft' check (review_status in ('draft', 'recheck_pending', 'finalized')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (class_id, session_date)
);

create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  roll_number text not null,
  student_name text not null,
  punched_at text,
  status text not null default 'pending' check (status in ('pending', 'present', 'left_after_punch', 'absent', 'late_present')),
  note text,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, roll_number)
);

create table if not exists public.attendance_rechecks (
  id uuid primary key default gen_random_uuid(),
  attendance_record_id uuid not null references public.attendance_records(id) on delete cascade,
  previous_status text not null,
  next_status text not null,
  note text,
  verified_by text,
  verified_at timestamptz not null default now()
);

create table if not exists public.attendance_student_marks (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  roll_number text not null,
  student_name text not null,
  marked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, roll_number)
);

create table if not exists public.student_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  enrollment_no text not null unique,
  full_name text not null,
  current_ip text,
  device_fingerprint text,
  device_label text,
  device_bound_at timestamptz,
  last_login_at timestamptz,
  last_logout_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.student_profiles
  add column if not exists device_fingerprint text;

alter table public.student_profiles
  add column if not exists device_label text;

alter table public.student_profiles
  add column if not exists device_bound_at timestamptz;

create or replace function public.assert_student_ip_available(
  p_current_ip text,
  p_enrollment_no text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  conflicting_profile public.student_profiles;
begin
  if p_current_ip is null or btrim(p_current_ip) = '' then
    raise exception 'Unable to validate student IP address.';
  end if;

  select *
  into conflicting_profile
  from public.student_profiles
  where current_ip = p_current_ip
    and (
      p_enrollment_no is null
      or enrollment_no <> upper(btrim(p_enrollment_no))
    )
  limit 1;

  if conflicting_profile.id is not null then
    raise exception 'This IP address is already being used by another enrollment. One IP can only have one active student login.';
  end if;
end;
$$;

create or replace function public.claim_student_ip_lock(
  p_auth_user_id uuid,
  p_enrollment_no text,
  p_full_name text,
  p_current_ip text
)
returns public.student_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_profile public.student_profiles;
  conflicting_enrollment public.student_profiles;
  conflicting_ip public.student_profiles;
  result_profile public.student_profiles;
begin
  if auth.uid() is distinct from p_auth_user_id then
    raise exception 'You are not allowed to claim this student profile.';
  end if;

  if p_current_ip is null or btrim(p_current_ip) = '' then
    raise exception 'Unable to validate student IP address.';
  end if;

  select *
  into conflicting_enrollment
  from public.student_profiles
  where enrollment_no = upper(btrim(p_enrollment_no))
    and auth_user_id <> p_auth_user_id
  limit 1;

  if conflicting_enrollment.id is not null then
    raise exception 'This enrollment number is already linked to another student account.';
  end if;

  select *
  into conflicting_ip
  from public.student_profiles
  where current_ip = p_current_ip
    and auth_user_id <> p_auth_user_id
  limit 1;

  if conflicting_ip.id is not null then
    raise exception 'This IP address is already being used by another enrollment. One IP can only have one active student login.';
  end if;

  select *
  into existing_profile
  from public.student_profiles
  where auth_user_id = p_auth_user_id
  limit 1;

  if existing_profile.id is not null
    and existing_profile.current_ip is not null
    and existing_profile.current_ip <> p_current_ip
    and existing_profile.last_login_at is not null
    and now() - existing_profile.last_login_at < interval '12 hours' then
    raise exception
      'This enrollment is already active on IP %. Please log out from the previous network first.',
      existing_profile.current_ip;
  end if;

  insert into public.student_profiles (
    auth_user_id,
    enrollment_no,
    full_name,
    current_ip,
    last_login_at
  )
  values (
    p_auth_user_id,
    upper(btrim(p_enrollment_no)),
    btrim(p_full_name),
    p_current_ip,
    now()
  )
  on conflict (auth_user_id) do update
  set
    enrollment_no = excluded.enrollment_no,
    full_name = excluded.full_name,
    current_ip = excluded.current_ip,
    last_login_at = excluded.last_login_at
  returning * into result_profile;

  return result_profile;
end;
$$;

create or replace function public.release_student_ip_lock(p_auth_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is distinct from p_auth_user_id then
    raise exception 'You are not allowed to release this student profile.';
  end if;

  update public.student_profiles
  set
    current_ip = null,
    last_logout_at = now()
  where auth_user_id = p_auth_user_id;
end;
$$;

create or replace function public.reset_student_device_binding(
  p_enrollment_no text
)
returns public.student_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  result_profile public.student_profiles;
begin
  update public.student_profiles
  set
    current_ip = null,
    device_fingerprint = null,
    device_label = null,
    device_bound_at = null,
    last_logout_at = now()
  where enrollment_no = upper(btrim(p_enrollment_no))
  returning * into result_profile;

  if result_profile.id is null then
    raise exception 'No student device binding was found for enrollment %.', upper(btrim(p_enrollment_no));
  end if;

  return result_profile;
end;
$$;

create or replace function public.teacher_reset_student_device_binding(
  p_enrollment_no text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result_profile public.student_profiles;
begin
  update public.student_profiles
  set
    current_ip = null,
    device_fingerprint = null,
    device_label = null,
    device_bound_at = null,
    last_logout_at = now()
  where enrollment_no = upper(btrim(p_enrollment_no))
  returning * into result_profile;

  if result_profile.id is null then
    raise exception 'No student device binding was found for enrollment %.', upper(btrim(p_enrollment_no));
  end if;

  return jsonb_build_object(
    'enrollment_no',
    result_profile.enrollment_no
  );
end;
$$;

create or replace function public.calculate_distance(lat1 float8, lon1 float8, lat2 float8, lon2 float8)
returns float8
language plpgsql
as $$
declare
  r float8 := 6371000; -- meters
  phi1 float8 := lat1 * pi() / 180;
  phi2 float8 := lat2 * pi() / 180;
  delta_phi float8 := (lat2 - lat1) * pi() / 180;
  delta_lambda float8 := (lon2 - lon1) * pi() / 180;
  a float8;
  c float8;
begin
  a := sin(delta_phi / 2) * sin(delta_phi / 2) +
       cos(phi1) * cos(phi2) *
       sin(delta_lambda / 2) * sin(delta_lambda / 2);
  c := 2 * atan2(sqrt(a), sqrt(1 - a));
  return r * c;
end;
$$;

create or replace function public.submit_student_mark_for_session(
  p_session_id uuid,
  p_wifi_name text default null,
  p_public_ip text default null,
  p_latitude float8 default null,
  p_longitude float8 default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  active_session public.attendance_sessions;
  class_config public.classes;
  student_profile public.student_profiles;
begin
  if auth.uid() is null then
    raise exception 'Student login is required before marking attendance.';
  end if;

  select *
  into active_session
  from public.attendance_sessions
  where id = p_session_id
  limit 1;

  if active_session.id is null then
    raise exception 'Attendance session not found.';
  end if;

  select *
  into class_config
  from public.classes
  where id = active_session.class_id
  limit 1;

  select *
  into student_profile
  from public.student_profiles
  where auth_user_id = auth.uid()
  limit 1;

  if student_profile.id is null then
    raise exception 'Student profile not found for this login.';
  end if;

  if class_config.allowed_wifi_public_ip is not null
    and (
      p_public_ip is null
      or btrim(p_public_ip) <> btrim(class_config.allowed_wifi_public_ip)
    ) then
    raise exception 'This class only allows attendance from public IP %.', class_config.allowed_wifi_public_ip;
  end if;

  if class_config.allowed_latitude is not null and class_config.allowed_longitude is not null then
    if p_latitude is null or p_longitude is null then
      raise exception 'Geolocation is required for this class.';
    end if;

    if public.calculate_distance(
        p_latitude, p_longitude, 
        class_config.allowed_latitude, class_config.allowed_longitude
      ) > coalesce(class_config.allowed_radius, 100) then
      raise exception 'You must be within % meters of the classroom to mark attendance.', coalesce(class_config.allowed_radius, 100);
    end if;
  end if;

  insert into public.attendance_student_marks (
    session_id,
    roll_number,
    student_name,
    marked_at
  )
  values (
    p_session_id,
    student_profile.enrollment_no,
    student_profile.full_name,
    now()
  )
  on conflict (session_id, roll_number) do update
  set
    student_name = excluded.student_name,
    marked_at = excluded.marked_at;
end;
$$;

create or replace function public.assert_student_access_available(
  p_current_ip text,
  p_device_fingerprint text,
  p_enrollment_no text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  conflicting_device public.student_profiles;
  existing_enrollment public.student_profiles;
begin
  if p_device_fingerprint is null or btrim(p_device_fingerprint) = '' then
    raise exception 'Unable to validate this device fingerprint.';
  end if;

  select *
  into conflicting_device
  from public.student_profiles
  where device_fingerprint = p_device_fingerprint
    and (
      p_enrollment_no is null
      or enrollment_no <> upper(btrim(p_enrollment_no))
    )
  limit 1;

  if conflicting_device.id is not null then
    raise exception 'This device is already linked to another student account. Only one enrollment can stay bound to one device.';
  end if;

  if p_enrollment_no is not null then
    select *
    into existing_enrollment
    from public.student_profiles
    where enrollment_no = upper(btrim(p_enrollment_no))
    limit 1;

    if existing_enrollment.id is not null
      and existing_enrollment.device_fingerprint is not null
      and existing_enrollment.device_fingerprint <> p_device_fingerprint then
      raise exception 'This enrollment is already bound to another device. Ask the teacher to reset it before logging in here.';
    end if;
  end if;
end;
$$;

create or replace function public.claim_student_access_lock(
  p_auth_user_id uuid,
  p_enrollment_no text,
  p_full_name text,
  p_current_ip text,
  p_device_fingerprint text,
  p_device_label text
)
returns public.student_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_profile public.student_profiles;
  conflicting_enrollment public.student_profiles;
  conflicting_device public.student_profiles;
  result_profile public.student_profiles;
begin
  if auth.uid() is distinct from p_auth_user_id then
    raise exception 'You are not allowed to claim this student profile.';
  end if;

  if p_device_fingerprint is null or btrim(p_device_fingerprint) = '' then
    raise exception 'Unable to validate this device fingerprint.';
  end if;

  select *
  into conflicting_enrollment
  from public.student_profiles
  where enrollment_no = upper(btrim(p_enrollment_no))
    and auth_user_id <> p_auth_user_id
  limit 1;

  if conflicting_enrollment.id is not null then
    raise exception 'This enrollment number is already linked to another student account.';
  end if;

  select *
  into conflicting_device
  from public.student_profiles
  where device_fingerprint = p_device_fingerprint
    and auth_user_id <> p_auth_user_id
  limit 1;

  if conflicting_device.id is not null then
    raise exception 'This device is already linked to another student account. Only one enrollment can stay bound to one device.';
  end if;

  select *
  into existing_profile
  from public.student_profiles
  where auth_user_id = p_auth_user_id
  limit 1;

  if existing_profile.id is not null
    and existing_profile.device_fingerprint is not null
    and existing_profile.device_fingerprint <> p_device_fingerprint then
    raise exception 'This enrollment is already bound to another device. Ask the teacher to reset it before logging in here.';
  end if;

  insert into public.student_profiles (
    auth_user_id,
    enrollment_no,
    full_name,
    current_ip,
    device_fingerprint,
    device_label,
    device_bound_at,
    last_login_at
  )
  values (
    p_auth_user_id,
    upper(btrim(p_enrollment_no)),
    btrim(p_full_name),
    p_current_ip,
    p_device_fingerprint,
    btrim(p_device_label),
    now(),
    now()
  )
  on conflict (auth_user_id) do update
  set
    enrollment_no = excluded.enrollment_no,
    full_name = excluded.full_name,
    current_ip = excluded.current_ip,
    device_fingerprint = coalesce(public.student_profiles.device_fingerprint, excluded.device_fingerprint),
    device_label = coalesce(public.student_profiles.device_label, excluded.device_label),
    device_bound_at = coalesce(public.student_profiles.device_bound_at, excluded.device_bound_at),
    last_login_at = excluded.last_login_at
  returning * into result_profile;

  return result_profile;
end;
$$;

create index if not exists attendance_sessions_class_id_idx
  on public.attendance_sessions(class_id, session_date desc);

create index if not exists attendance_records_session_id_idx
  on public.attendance_records(session_id, status);

create index if not exists attendance_records_roll_number_idx
  on public.attendance_records(roll_number);

create index if not exists attendance_student_marks_session_id_idx
  on public.attendance_student_marks(session_id, roll_number);

create index if not exists student_profiles_enrollment_no_idx
  on public.student_profiles(enrollment_no);

drop index if exists public.student_profiles_current_ip_unique_idx;

create unique index if not exists student_profiles_device_fingerprint_unique_idx
  on public.student_profiles(device_fingerprint)
  where device_fingerprint is not null;

drop trigger if exists classes_set_updated_at on public.classes;
create trigger classes_set_updated_at
before update on public.classes
for each row execute function public.set_updated_at();

drop trigger if exists attendance_sessions_set_updated_at on public.attendance_sessions;
create trigger attendance_sessions_set_updated_at
before update on public.attendance_sessions
for each row execute function public.set_updated_at();

drop trigger if exists attendance_records_set_updated_at on public.attendance_records;
create trigger attendance_records_set_updated_at
before update on public.attendance_records
for each row execute function public.set_updated_at();

drop trigger if exists attendance_student_marks_set_updated_at on public.attendance_student_marks;
create trigger attendance_student_marks_set_updated_at
before update on public.attendance_student_marks
for each row execute function public.set_updated_at();

drop trigger if exists student_profiles_set_updated_at on public.student_profiles;
create trigger student_profiles_set_updated_at
before update on public.student_profiles
for each row execute function public.set_updated_at();

alter table public.classes enable row level security;
alter table public.attendance_sessions enable row level security;
alter table public.attendance_records enable row level security;
alter table public.attendance_rechecks enable row level security;
alter table public.attendance_student_marks enable row level security;
alter table public.student_profiles enable row level security;

drop policy if exists "demo classes access" on public.classes;
create policy "demo classes access"
on public.classes
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "demo sessions access" on public.attendance_sessions;
create policy "demo sessions access"
on public.attendance_sessions
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "demo records access" on public.attendance_records;
create policy "demo records access"
on public.attendance_records
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "demo rechecks access" on public.attendance_rechecks;
create policy "demo rechecks access"
on public.attendance_rechecks
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "demo student marks access" on public.attendance_student_marks;
drop policy if exists "student marks read access" on public.attendance_student_marks;
create policy "student marks read access"
on public.attendance_student_marks
for select
to anon, authenticated
using (true);

drop policy if exists "student marks delete access" on public.attendance_student_marks;
create policy "student marks delete access"
on public.attendance_student_marks
for delete
to anon, authenticated
using (true);

drop policy if exists "student profiles self access" on public.student_profiles;
drop policy if exists "demo student profiles access" on public.student_profiles;
create policy "demo student profiles access"
on public.student_profiles
for all
to anon, authenticated
using (true)
with check (true);

grant execute on function public.assert_student_ip_available(text, text) to anon, authenticated;
grant execute on function public.claim_student_ip_lock(uuid, text, text, text) to authenticated;
grant execute on function public.release_student_ip_lock(uuid) to authenticated;
grant execute on function public.reset_student_device_binding(text) to anon, authenticated;
grant execute on function public.teacher_reset_student_device_binding(text) to anon, authenticated;
grant execute on function public.assert_student_access_available(text, text, text) to anon, authenticated;
grant execute on function public.claim_student_access_lock(uuid, text, text, text, text, text) to authenticated;
grant execute on function public.submit_student_mark_for_session(uuid, text, text, float8, float8) to authenticated;

-- --------------------------------------------------------
-- QUIZ FEATURE TABLES
-- --------------------------------------------------------

ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS quiz_enabled BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Class Quiz',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    options TEXT[] NOT NULL,
    correct_option_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quiz_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    student_profile_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
    answers INTEGER[] NOT NULL,
    score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(quiz_id, student_profile_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_quizzes_class_id ON public.quizzes(class_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON public.quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_session_id ON public.quiz_submissions(session_id);

-- --------------------------------------------------------
-- QUIZ SUBMISSION AND ATTENDANCE MARKING RPC
-- --------------------------------------------------------

CREATE OR REPLACE FUNCTION public.submit_quiz_and_mark_attendance(
    p_session_id UUID,
    p_quiz_id UUID,
    p_answers INTEGER[], -- student answers (0-based indices)
    p_public_ip TEXT DEFAULT NULL,
    p_latitude FLOAT8 DEFAULT NULL,
    p_longitude FLOAT8 DEFAULT NULL
)
RETURNS TABLE (
    score INTEGER,
    max_score INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_class_config RECORD;
    v_session RECORD;
    v_student_profile RECORD;
    v_correct_count INTEGER := 0;
    v_total_questions INTEGER := 0;
    v_q_record RECORD;
    v_idx INTEGER := 1;
    v_loc_matches BOOLEAN := false;
    v_wifi_matches BOOLEAN := false;
    v_dist FLOAT8;
BEGIN
    -- 1. Get Context
    SELECT * INTO v_session FROM public.attendance_sessions WHERE id = p_session_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Session not found'; END IF;

    SELECT * INTO v_class_config FROM public.classes WHERE id = v_session.class_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Class not found'; END IF;

    SELECT * INTO v_student_profile FROM public.student_profiles WHERE auth_user_id = auth.uid();
    IF NOT FOUND THEN RAISE EXCEPTION 'Student profile not found'; END IF;

    -- 2. Gating Check (WiFi OR Geo)
    -- One of them must match if configured
    IF v_class_config.allowed_wifi_public_ip IS NOT NULL AND p_public_ip IS NOT NULL THEN
        IF btrim(v_class_config.allowed_wifi_public_ip) = btrim(p_public_ip) THEN
            v_wifi_matches := true;
        END IF;
    END IF;

    IF v_class_config.allowed_latitude IS NOT NULL AND v_class_config.allowed_longitude IS NOT NULL AND p_latitude IS NOT NULL AND p_longitude IS NOT NULL THEN
        v_dist := public.calculate_distance(p_latitude, p_longitude, v_class_config.allowed_latitude, v_class_config.allowed_longitude);
        IF v_dist <= COALESCE(v_class_config.allowed_radius, 100) THEN
            v_loc_matches := true;
        END IF;
    END IF;

    -- If either is set, at least one must pass. If neither set, allow.
    IF (v_class_config.allowed_wifi_public_ip IS NOT NULL OR v_class_config.allowed_latitude IS NOT NULL) THEN
        IF NOT (v_wifi_matches OR v_loc_matches) THEN
            RAISE EXCEPTION 'Identity verification failed. You are either not on class WiFi or not in range.';
        END IF;
    END IF;

    -- 3. Calculate Score
    FOR v_q_record IN SELECT * FROM public.quiz_questions WHERE quiz_id = p_quiz_id ORDER BY created_at ASC LOOP
        v_total_questions := v_total_questions + 1;
        IF array_length(p_answers, 1) >= v_idx AND p_answers[v_idx] = v_q_record.correct_option_index THEN
            v_correct_count := v_correct_count + 1;
        END IF;
        v_idx := v_idx + 1;
    END LOOP;

    IF v_total_questions = 0 THEN RAISE EXCEPTION 'Quiz has no questions'; END IF;

    -- 4. Record Submission
    INSERT INTO public.quiz_submissions (quiz_id, student_profile_id, session_id, answers, score, max_score)
    VALUES (p_quiz_id, v_student_profile.id, p_session_id, p_answers, v_correct_count, v_total_questions)
    ON CONFLICT (quiz_id, student_profile_id, session_id) DO UPDATE 
    SET answers = EXCLUDED.answers, score = EXCLUDED.score, submitted_at = now();

    -- 5. Mark Attendance (using existing logic with named parameters to avoid positional mismatch)
    PERFORM public.submit_student_mark_for_session(
        p_session_id := p_session_id,
        p_public_ip := p_public_ip,
        p_latitude := p_latitude,
        p_longitude := p_longitude
    );

    RETURN QUERY SELECT v_correct_count, v_total_questions;
END;
$$;

-- RPC TO UPSERT QUIZ AND QUESTIONS
CREATE OR REPLACE FUNCTION public.upsert_quiz(
    p_class_id UUID,
    p_title TEXT,
    p_questions JSONB -- Array of {question_text, options, correct_option_index}
)
RETURNS UUID AS $$
DECLARE
    v_quiz_id UUID;
    v_q JSONB;
BEGIN
    -- 1. Check if quiz exists for class
    SELECT id INTO v_quiz_id FROM public.quizzes WHERE class_id = p_class_id;
    
    IF v_quiz_id IS NOT NULL THEN
        -- Update existing quiz
        UPDATE public.quizzes SET title = p_title WHERE id = v_quiz_id;
        -- Delete old questions
        DELETE FROM public.quiz_questions WHERE quiz_id = v_quiz_id;
    ELSE
        -- Create new quiz
        INSERT INTO public.quizzes (class_id, title)
        VALUES (p_class_id, p_title)
        RETURNING id INTO v_quiz_id;
    END IF;

    -- 2. Insert questions
    FOR v_q IN SELECT * FROM jsonb_array_elements(p_questions) LOOP
        INSERT INTO public.quiz_questions (quiz_id, question_text, options, correct_option_index)
        VALUES (
            v_quiz_id,
            (v_q->>'question_text'),
            ARRAY(SELECT jsonb_array_elements_text(v_q->'options')),
            (v_q->>'correct_option_index')::INTEGER
        );
    END LOOP;

    RETURN v_quiz_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.submit_quiz_and_mark_attendance(uuid, uuid, integer[], text, float8, float8) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_quiz(uuid, text, jsonb) TO authenticated;

-- Teacher/Admin Authentication
create table if not exists public.admin_auth (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_plaintext text not null,
  created_at timestamptz not null default now()
);

-- Initial Credential for Teacher
insert into public.admin_auth (username, password_plaintext)
values ('RIYANSH', 'RIYANSH@2928')
on conflict (username) do update set password_plaintext = excluded.password_plaintext;

-- Enable RLS to protect from direct frontend exploitation
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_student_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_rechecks ENABLE ROW LEVEL SECURITY;

-- Note: No policies are added, so by default ALL access is blocked 
-- for anonymous and authenticated users. The API-Server uses 
-- the service_role key to manage data securely.
