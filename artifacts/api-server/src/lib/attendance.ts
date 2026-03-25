import { z } from "zod";
import { supabase } from "./supabase";
import { assertExists, HttpError } from "./http";
import { defaultClasses } from "./default-classes";

type SessionReviewStatus = "draft" | "recheck_pending" | "finalized";
type AttendanceStatus =
  | "pending"
  | "present"
  | "left_after_punch"
  | "absent"
  | "late_present";

type DbClass = {
  id: string;
  code: string;
  name: string;
  room: string | null;
  schedule_text: string | null;
  expected_students: number | null;
  color_start: string | null;
  color_end: string | null;
  allowed_wifi_name: string | null;
  allowed_wifi_public_ip: string | null;
  allowed_latitude: number | null;
  allowed_longitude: number | null;
  allowed_radius: number | null;
  quiz_enabled: boolean;
  created_at: string;
  updated_at: string;
};

type DbSession = {
  id: string;
  class_id: string;
  session_date: string;
  source_file_name: string | null;
  upload_count: number;
  review_status: SessionReviewStatus;
  created_at: string;
  updated_at: string;
};

type DbRecord = {
  id: string;
  session_id: string;
  roll_number: string;
  student_name: string;
  punched_at: string | null;
  status: AttendanceStatus;
  note: string | null;
  last_verified_at: string | null;
  created_at: string;
  updated_at: string;
};

type DbStudentMark = {
  id: string;
  session_id: string;
  roll_number: string;
  student_name: string;
  marked_at: string;
  created_at: string;
  updated_at: string;
};

type ClassSummaryCounts = {
  uploadedCount: number;
  verifiedCount: number;
  questionableCount: number;
  absentCount: number;
  attendanceRate: number;
};

type SessionSummary = ClassSummaryCounts & {
  pendingCount: number;
};

const uploadRowSchema = z.object({
  rollNumber: z.string().trim().min(1),
  studentName: z.string().trim().min(1),
  punchedAt: z.string().trim().nullable().optional(),
});

export const createClassSchema = z.object({
  code: z.string().trim().min(2).max(20),
  name: z.string().trim().min(2).max(120),
  room: z.string().trim().max(120).optional().nullable(),
  scheduleText: z.string().trim().max(160).optional().nullable(),
  expectedStudents: z.number().int().min(0).max(5000).default(0),
  colorStart: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  colorEnd: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export const importPunchesSchema = z.object({
  sessionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sourceFileName: z.string().trim().min(1).max(255),
  rows: z.array(uploadRowSchema).min(1).max(5000),
});

export const recheckSchema = z.object({
  updates: z
    .array(
      z.object({
        recordId: z.string().uuid(),
        status: z.enum([
          "pending",
          "present",
          "left_after_punch",
          "absent",
          "late_present",
        ]),
        note: z.string().trim().max(500).optional().nullable(),
      }),
    )
    .min(1),
  reviewerName: z.string().trim().max(120).optional().nullable(),
});

export const studentMarkSchema = z.object({
  rollNumber: z.string().trim().min(1).max(40),
  studentName: z.string().trim().min(2).max(160),
});

let seedPromise: Promise<void> | null = null;

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function roundPercentage(value: number): number {
  return Math.round(value * 10) / 10;
}

function normalizeStatus(status: AttendanceStatus): "present" | "questionable" | "absent" {
  if (status === "present" || status === "late_present") {
    return "present";
  }

  if (status === "absent") {
    return "absent";
  }

  return "questionable";
}

function summarizeRecords(records: DbRecord[]): SessionSummary {
  const verifiedCount = records.filter(
    (record) => record.status === "present" || record.status === "late_present",
  ).length;
  const questionableCount = records.filter(
    (record) => record.status === "left_after_punch" || record.status === "pending",
  ).length;
  const absentCount = records.filter((record) => record.status === "absent").length;
  const pendingCount = records.filter((record) => record.status === "pending").length;
  const uploadedCount = records.length;
  const attendanceRate =
    uploadedCount === 0 ? 0 : roundPercentage((verifiedCount / uploadedCount) * 100);

  return {
    uploadedCount,
    verifiedCount,
    questionableCount,
    absentCount,
    pendingCount,
    attendanceRate,
  };
}

function timeElapsedSince(isoString: string): string {
  const startedAt = new Date(isoString).getTime();
  const diff = Math.max(Date.now() - startedAt, 0);
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);

  return [hours, minutes, seconds]
    .map((part) => part.toString().padStart(2, "0"))
    .join(":");
}

function buildAvatarUrl(rollNumber: string): string {
  const avatars = [
    "/images/avatar-1.png",
    "/images/avatar-2.png",
    "/images/avatar-3.png",
    "/images/avatar-4.png",
  ];
  const sum = [...rollNumber].reduce((total, char) => total + char.charCodeAt(0), 0);
  return avatars[sum % avatars.length] ?? avatars[0];
}

function cleanPunchRows(rows: z.infer<typeof uploadRowSchema>[]) {
  const deduped = new Map<string, z.infer<typeof uploadRowSchema>>();

  for (const row of rows) {
    const rollNumber = row.rollNumber.trim().toUpperCase();
    const studentName = row.studentName.trim();
    const punchedAt = row.punchedAt?.trim() ? row.punchedAt.trim() : null;

    if (!rollNumber || !studentName) {
      continue;
    }

    deduped.set(rollNumber, {
      rollNumber,
      studentName,
      punchedAt,
    });
  }

  if (deduped.size === 0) {
    throw new HttpError(
      400,
      "The upload did not contain any usable rows. Make sure the sheet has roll number and student name columns.",
    );
  }

  return [...deduped.values()];
}

function getSupabaseErrorMessage(error: { message?: string } | null): string {
  return error?.message ?? "Unknown Supabase error";
}

async function requireQuery<T>(
  query: PromiseLike<{ data: T | null; error: { message?: string } | null }>,
  message: string,
): Promise<NonNullable<T>> {
  const { data, error } = await query;

  if (error) {
    throw new HttpError(500, `${message}: ${getSupabaseErrorMessage(error)}`);
  }

  return assertExists(data, message, 500);
}

async function maybeQuery<T>(
  query: PromiseLike<{ data: T | null; error: { code?: string; message?: string } | null }>,
  message: string,
): Promise<NonNullable<T> | null> {
  const { data, error } = await query;

  if (error && error.code !== "PGRST116") {
    throw new HttpError(500, `${message}: ${getSupabaseErrorMessage(error)}`);
  }

  return data as NonNullable<T> | null;
}

async function ensureSeedClasses(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      const existingClasses = await requireQuery<Array<Pick<DbClass, "id">>>(
        supabase.from("classes").select("id"),
        "Unable to load classes",
      );

      if (existingClasses.length > 0) {
        return;
      }

      const { error } = await supabase.from("classes").insert(defaultClasses);

      if (error) {
        throw new HttpError(
          500,
          `Unable to seed default classes: ${getSupabaseErrorMessage(error)}`,
        );
      }
    })();
  }

  await seedPromise;
}

async function loadClasses(): Promise<DbClass[]> {
  await ensureSeedClasses();

  return requireQuery<DbClass[]>(
    supabase.from("classes").select("*").order("code", { ascending: true }),
    "Unable to fetch classes",
  );
}

async function loadSessionsForClassIds(classIds: string[]): Promise<DbSession[]> {
  if (classIds.length === 0) {
    return [];
  }

  return requireQuery<DbSession[]>(
    supabase
      .from("attendance_sessions")
      .select("*")
      .in("class_id", classIds)
      .order("session_date", { ascending: false }),
    "Unable to fetch attendance sessions",
  );
}

async function loadRecordsForSessionIds(sessionIds: string[]): Promise<DbRecord[]> {
  if (sessionIds.length === 0) {
    return [];
  }

  return requireQuery<DbRecord[]>(
    supabase
      .from("attendance_records")
      .select("*")
      .in("session_id", sessionIds)
      .order("student_name", { ascending: true }),
    "Unable to fetch attendance records",
  );
}

async function loadStudentMarksForSessionIds(
  sessionIds: string[],
): Promise<DbStudentMark[]> {
  if (sessionIds.length === 0) {
    return [];
  }

  return requireQuery<DbStudentMark[]>(
    supabase
      .from("attendance_student_marks")
      .select("*")
      .in("session_id", sessionIds)
      .order("marked_at", { ascending: false }),
    "Unable to fetch student marks",
  );
}

async function loadLatestSessionForClass(classId: string): Promise<DbSession | null> {
  return maybeQuery<DbSession>(
    supabase
      .from("attendance_sessions")
      .select("*")
      .eq("class_id", classId)
      .order("session_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    "Unable to fetch latest session",
  );
}

function buildClassSummaries(
  classes: DbClass[],
  sessions: DbSession[],
  records: DbRecord[],
) {
  const today = todayIsoDate();
  const latestSessionByClass = new Map<string, DbSession>();

  for (const session of sessions) {
    if (!latestSessionByClass.has(session.class_id)) {
      latestSessionByClass.set(session.class_id, session);
    }
  }

  const recordsBySession = new Map<string, DbRecord[]>();

  for (const record of records) {
    const bucket = recordsBySession.get(record.session_id);
    if (bucket) {
      bucket.push(record);
    } else {
      recordsBySession.set(record.session_id, [record]);
    }
  }

  return classes.map((classItem) => {
    const latestSession = latestSessionByClass.get(classItem.id) ?? null;
    const latestRecords = latestSession
      ? (recordsBySession.get(latestSession.id) ?? [])
      : [];
    const summary = summarizeRecords(latestRecords);

    let status: "active" | "scheduled" | "ended" = "scheduled";

    if (latestSession) {
      if (
        latestSession.session_date === today &&
        latestSession.review_status !== "finalized"
      ) {
        status = "active";
      } else {
        status = "ended";
      }
    }

    return {
      id: classItem.id,
      code: classItem.code,
      name: classItem.name,
      room: classItem.room ?? "Room not set",
      scheduleText: classItem.schedule_text ?? "Schedule not set",
      expectedStudents: classItem.expected_students ?? 0,
      colorStart: classItem.color_start ?? "#6366f1",
      colorEnd: classItem.color_end ?? "#7c3aed",
      latestSessionId: latestSession?.id ?? null,
      latestSessionDate: latestSession?.session_date ?? null,
      reviewStatus: latestSession?.review_status ?? null,
      allowedWifiName: classItem.allowed_wifi_name ?? null,
      allowedWifiPublicIp: classItem.allowed_wifi_public_ip ?? null,
      allowedLatitude: classItem.allowed_latitude ?? null,
      allowedLongitude: classItem.allowed_longitude ?? null,
      allowedRadius: classItem.allowed_radius ?? null,
      quizEnabled: classItem.quiz_enabled ?? false,
      status,
      ...summary,
    };
  });
}

async function loadClassOrThrow(classId: string): Promise<DbClass> {
  const classItem = await maybeQuery<DbClass>(
    supabase.from("classes").select("*").eq("id", classId).maybeSingle(),
    "Unable to fetch class",
  );

  return assertExists(classItem, "Class not found");
}

function formatSessionPayload(
  classItem: DbClass,
  session: DbSession,
  records: DbRecord[],
  studentMarks: DbStudentMark[],
) {
  const summary = summarizeRecords(records);
  const markByRoll = new Map(
    studentMarks.map((mark) => [mark.roll_number.toUpperCase(), mark]),
  );
  const uploadedRolls = new Set(records.map((record) => record.roll_number.toUpperCase()));
  const markedRolls = new Set(studentMarks.map((mark) => mark.roll_number.toUpperCase()));
  const matchedCount = [...markedRolls].filter((roll) => uploadedRolls.has(roll)).length;
  const punchOnlyCount = [...uploadedRolls].filter((roll) => !markedRolls.has(roll)).length;
  const markOnlyCount = [...markedRolls].filter((roll) => !uploadedRolls.has(roll)).length;

  return {
    session: {
      id: session.id,
      classId: classItem.id,
      className: classItem.name,
      classCode: classItem.code,
      room: classItem.room ?? "Room not set",
      allowedWifiName: classItem.allowed_wifi_name ?? null,
      allowedWifiPublicIp: classItem.allowed_wifi_public_ip ?? null,
      allowedLatitude: classItem.allowed_latitude ?? null,
      allowedLongitude: classItem.allowed_longitude ?? null,
      allowedRadius: classItem.allowed_radius ?? null,
      quizEnabled: classItem.quiz_enabled ?? false,
      sessionDate: session.session_date,
      sourceFileName: session.source_file_name ?? "Imported file",
      uploadCount: session.upload_count,
      reviewStatus: session.review_status,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
      studentMarkedCount: studentMarks.length,
      matchedCount,
      punchOnlyCount,
      markOnlyCount,
      ...summary,
    },
    records: records.map((record) => ({
      studentMarked: markByRoll.has(record.roll_number.toUpperCase()),
      markedAt: markByRoll.get(record.roll_number.toUpperCase())?.marked_at ?? null,
      markedName: markByRoll.get(record.roll_number.toUpperCase())?.student_name ?? null,
      id: record.id,
      rollNumber: record.roll_number,
      studentName: record.student_name,
      punchedAt: record.punched_at,
      status: record.status,
      note: record.note,
      normalizedStatus: normalizeStatus(record.status),
      avatarUrl: buildAvatarUrl(record.roll_number),
      updatedAt: record.updated_at,
    })),
    unmatchedStudentMarks: studentMarks
      .filter((mark) => !uploadedRolls.has(mark.roll_number.toUpperCase()))
      .map((mark) => ({
        id: mark.id,
        rollNumber: mark.roll_number,
        studentName: mark.student_name,
        markedAt: mark.marked_at,
        avatarUrl: buildAvatarUrl(mark.roll_number),
      })),
  };
}

export async function listClasses() {
  const classes = await loadClasses();
  const sessions = await loadSessionsForClassIds(classes.map((item) => item.id));
  const latestSessionIds = Array.from(
    new Set(
      sessions
        .filter(
          (session, index, all) =>
            all.findIndex((candidate) => candidate.class_id === session.class_id) === index,
        )
        .map((session) => session.id),
    ),
  );
  const records = await loadRecordsForSessionIds(latestSessionIds);

  return buildClassSummaries(classes, sessions, records);
}

export async function createClass(input: z.infer<typeof createClassSchema>) {
  const payload = createClassSchema.parse(input);

  const created = await requireQuery<DbClass>(
    supabase
      .from("classes")
      .insert({
        code: payload.code.toUpperCase(),
        name: payload.name,
        room: payload.room ?? null,
        schedule_text: payload.scheduleText ?? null,
        expected_students: payload.expectedStudents,
        color_start: payload.colorStart ?? "#6366f1",
        color_end: payload.colorEnd ?? "#7c3aed",
      })
      .select("*")
      .single(),
    "Unable to create class",
  );

  return {
    id: created.id,
    code: created.code,
    name: created.name,
    room: created.room,
    scheduleText: created.schedule_text,
    expectedStudents: created.expected_students,
    colorStart: created.color_start,
    colorEnd: created.color_end,
  };
}

export async function importPunchesForClass(
  classId: string,
  input: z.infer<typeof importPunchesSchema>,
) {
  const payload = importPunchesSchema.parse(input);
  const classItem = await loadClassOrThrow(classId);
  const rows = cleanPunchRows(payload.rows);

  const session = await requireQuery<DbSession>(
    supabase
      .from("attendance_sessions")
      .upsert(
        {
          class_id: classId,
          session_date: payload.sessionDate,
          source_file_name: payload.sourceFileName,
          upload_count: rows.length,
          review_status: "recheck_pending",
        },
        {
          onConflict: "class_id,session_date",
        },
      )
      .select("*")
      .single(),
    "Unable to create attendance session",
  );

  const { error: deleteError } = await supabase
    .from("attendance_records")
    .delete()
    .eq("session_id", session.id);

  if (deleteError) {
    throw new HttpError(
      500,
      `Unable to replace previous upload rows: ${getSupabaseErrorMessage(deleteError)}`,
    );
  }

  const { error: deleteMarksError } = await supabase
    .from("attendance_student_marks")
    .delete()
    .eq("session_id", session.id);

  if (deleteMarksError) {
    throw new HttpError(
      500,
      `Unable to clear previous student marks: ${getSupabaseErrorMessage(deleteMarksError)}`,
    );
  }

  const recordPayload = rows.map((row) => ({
    session_id: session.id,
    roll_number: row.rollNumber,
    student_name: row.studentName,
    punched_at: row.punchedAt ?? null,
    status: "pending" as const,
    note: null,
    last_verified_at: null,
  }));

  const { error: insertError } = await supabase
    .from("attendance_records")
    .insert(recordPayload);

  if (insertError) {
    throw new HttpError(
      500,
      `Unable to save uploaded attendance rows: ${getSupabaseErrorMessage(insertError)}`,
    );
  }

  return getSessionDetails(session.id, classItem);
}

export async function getLatestSessionForClass(classId: string) {
  const classItem = await loadClassOrThrow(classId);
  const latestSession = await loadLatestSessionForClass(classId);

  if (!latestSession) {
    return null;
  }

  return getSessionDetails(latestSession.id, classItem);
}

async function getSessionDetails(sessionId: string, classItem?: DbClass) {
  const session = await maybeQuery<DbSession>(
    supabase
      .from("attendance_sessions")
      .select("*")
      .eq("id", sessionId)
      .maybeSingle(),
    "Unable to fetch attendance session",
  );

  const resolvedSession = assertExists(session, "Attendance session not found");
  const resolvedClass = classItem ?? (await loadClassOrThrow(resolvedSession.class_id));
  const records = await requireQuery<DbRecord[]>(
    supabase
      .from("attendance_records")
      .select("*")
      .eq("session_id", resolvedSession.id)
      .order("student_name", { ascending: true }),
    "Unable to fetch session records",
  );
  const studentMarks = await loadStudentMarksForSessionIds([resolvedSession.id]);

  return formatSessionPayload(resolvedClass, resolvedSession, records, studentMarks);
}

export async function submitStudentMark(
  sessionId: string,
  input: z.infer<typeof studentMarkSchema>,
) {
  const payload = studentMarkSchema.parse(input);
  const session = await maybeQuery<DbSession>(
    supabase
      .from("attendance_sessions")
      .select("*")
      .eq("id", sessionId)
      .maybeSingle(),
    "Unable to fetch attendance session",
  );

  const resolvedSession = assertExists(session, "Attendance session not found");
  const classItem = await loadClassOrThrow(resolvedSession.class_id);

  const { error } = await supabase
    .from("attendance_student_marks")
    .upsert(
      {
        session_id: sessionId,
        roll_number: payload.rollNumber.trim().toUpperCase(),
        student_name: payload.studentName.trim(),
        marked_at: new Date().toISOString(),
      },
      {
        onConflict: "session_id,roll_number",
      },
    );

  if (error) {
    throw new HttpError(
      500,
      `Unable to save student attendance mark: ${getSupabaseErrorMessage(error)}`,
    );
  }

  return getSessionDetails(sessionId, classItem);
}

export async function saveSessionRecheck(
  sessionId: string,
  input: z.infer<typeof recheckSchema>,
) {
  const payload = recheckSchema.parse(input);
  const session = await maybeQuery<DbSession>(
    supabase
      .from("attendance_sessions")
      .select("*")
      .eq("id", sessionId)
      .maybeSingle(),
    "Unable to fetch attendance session",
  );

  const resolvedSession = assertExists(session, "Attendance session not found");
  const classItem = await loadClassOrThrow(resolvedSession.class_id);
  const targetIds = payload.updates.map((update) => update.recordId);
  const existingRecords = await requireQuery<DbRecord[]>(
    supabase
      .from("attendance_records")
      .select("*")
      .eq("session_id", sessionId)
      .in("id", targetIds),
    "Unable to load records for recheck",
  );

  const existingById = new Map(existingRecords.map((record) => [record.id, record]));
  const auditRows: Array<{
    attendance_record_id: string;
    previous_status: AttendanceStatus;
    next_status: AttendanceStatus;
    note: string | null;
    verified_by: string | null;
  }> = [];

  for (const update of payload.updates) {
    const existing = existingById.get(update.recordId);

    if (!existing) {
      throw new HttpError(404, `Attendance record ${update.recordId} was not found.`);
    }

    const { error } = await supabase
      .from("attendance_records")
      .update({
        status: update.status,
        note: update.note ?? null,
        last_verified_at: new Date().toISOString(),
      })
      .eq("id", update.recordId);

    if (error) {
      throw new HttpError(
        500,
        `Unable to save recheck updates: ${getSupabaseErrorMessage(error)}`,
      );
    }

    if (existing.status !== update.status || existing.note !== (update.note ?? null)) {
      auditRows.push({
        attendance_record_id: update.recordId,
        previous_status: existing.status,
        next_status: update.status,
        note: update.note ?? null,
        verified_by: payload.reviewerName ?? null,
      });
    }
  }

  if (auditRows.length > 0) {
    const { error } = await supabase.from("attendance_rechecks").insert(auditRows);

    if (error) {
      throw new HttpError(
        500,
        `Unable to save recheck history: ${getSupabaseErrorMessage(error)}`,
      );
    }
  }

  const refreshedRecords = await requireQuery<DbRecord[]>(
    supabase
      .from("attendance_records")
      .select("*")
      .eq("session_id", sessionId),
    "Unable to reload session records",
  );

  const hasPending = refreshedRecords.some((record) => record.status === "pending");
  const nextReviewStatus: SessionReviewStatus = hasPending
    ? "recheck_pending"
    : "finalized";

  const { error: sessionUpdateError } = await supabase
    .from("attendance_sessions")
    .update({
      review_status: nextReviewStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  if (sessionUpdateError) {
    throw new HttpError(
      500,
      `Unable to update session status: ${getSupabaseErrorMessage(sessionUpdateError)}`,
    );
  }

  return getSessionDetails(sessionId, classItem);
}

function resolveRangeStart(range: string | null | undefined): string | null {
  if (!range || range === "all") {
    return null;
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (range === "today") {
    return today.toISOString().slice(0, 10);
  }

  if (range === "yesterday") {
    today.setDate(today.getDate() - 1);
    return today.toISOString().slice(0, 10);
  }

  if (range === "last7") {
    today.setDate(today.getDate() - 6);
    return today.toISOString().slice(0, 10);
  }

  if (range === "last30") {
    today.setDate(today.getDate() - 29);
    return today.toISOString().slice(0, 10);
  }

  throw new HttpError(400, `Unsupported date range: ${range}`);
}

async function loadOperationalDataset(daysBack = 60) {
  const classes = await loadClasses();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysBack);
  const cutoffIso = cutoff.toISOString().slice(0, 10);

  const sessions = await requireQuery<DbSession[]>(
    supabase
      .from("attendance_sessions")
      .select("*")
      .gte("session_date", cutoffIso)
      .order("session_date", { ascending: false }),
    "Unable to fetch attendance sessions",
  );
  const records = await loadRecordsForSessionIds(sessions.map((session) => session.id));
  const studentMarks = await loadStudentMarksForSessionIds(
    sessions.map((session) => session.id),
  );

  return { classes, sessions, records, studentMarks };
}

export async function getDashboardData() {
  const { classes, sessions, records, studentMarks } = await loadOperationalDataset(14);
  const classSummaries = buildClassSummaries(classes, sessions, records);
  const sessionMap = new Map(sessions.map((session) => [session.id, session]));
  const classMap = new Map(classes.map((classItem) => [classItem.id, classItem]));
  const latestRecordsByClassSession = new Map<string, DbRecord[]>();

  for (const classSummary of classSummaries) {
    if (!classSummary.latestSessionId) continue;
    latestRecordsByClassSession.set(
      classSummary.latestSessionId,
      records.filter((record) => record.session_id === classSummary.latestSessionId),
    );
  }

  const sessionMarksBySession = new Map<string, Set<string>>();
  for (const mark of studentMarks) {
    const set = sessionMarksBySession.get(mark.session_id) ?? new Set();
    set.add(mark.roll_number.toUpperCase());
    sessionMarksBySession.set(mark.session_id, set);
  }

  const latestRecords = Array.from(latestRecordsByClassSession.values()).flat();
  const verifiedPresentMatched = latestRecords.filter((record: DbRecord) => {
    const marks = sessionMarksBySession.get(record.session_id);
    const hasMark = marks?.has(record.roll_number.toUpperCase());
    return record.status === "present" || record.status === "late_present" || hasMark;
  }).length;

  const latestSessionIds = new Set(latestRecordsByClassSession.keys());
  const unmatchedLatestMarks = studentMarks.filter((mark) => {
    if (!latestSessionIds.has(mark.session_id)) return false;
    const sessionRecords = latestRecordsByClassSession.get(mark.session_id) ?? [];
    return !sessionRecords.some((r: DbRecord) => r.roll_number.toUpperCase() === mark.roll_number.toUpperCase());
  }).length;

  const verifiedPresent = verifiedPresentMatched + unmatchedLatestMarks;

  const flaggedToday = latestRecords.filter((record: DbRecord) => {
    const marks = sessionMarksBySession.get(record.session_id);
    const hasMark = marks?.has(record.roll_number.toUpperCase());
    return (record.status === "left_after_punch" || record.status === "pending") && !hasMark;
  }).length;

  const totalStudents = classSummaries.reduce(
    (sum, classItem) => sum + classItem.uploadedCount,
    0,
  );

  const totalPossible = latestRecords.length + unmatchedLatestMarks;
  const score = totalPossible === 0 ? 0 : Math.round((verifiedPresent / totalPossible) * 100);

    const last7Days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      const isoDate = date.toISOString().slice(0, 10);
      const dayLabel = date.toLocaleDateString("en-US", { weekday: "short" });
      const dailyRecords = records.filter((r) => {
        const s = sessionMap.get(r.session_id);
        return s?.session_date === isoDate;
      });
      const dailySessions = sessions.filter(s => s.session_date === isoDate);
      const dailySessionIds = new Set(dailySessions.map(s => s.id));
      const dayMarks = studentMarks.filter(m => dailySessionIds.has(m.session_id));
      const marksBySession = new Map<string, Set<string>>();
      for (const m of dayMarks) {
        const set = marksBySession.get(m.session_id) ?? new Set();
        set.add(m.roll_number.toUpperCase());
        marksBySession.set(m.session_id, set);
      }

      const verified = dailyRecords.filter((r) => {
        const marks = marksBySession.get(r.session_id);
        return r.status === "present" || r.status === "late_present" || marks?.has(r.roll_number.toUpperCase());
      }).length;

      const unmatched = dayMarks.filter(m => {
        const sessionRecords = dailyRecords.filter(r => r.session_id === m.session_id);
        return !sessionRecords.some(r => r.roll_number.toUpperCase() === m.roll_number.toUpperCase());
      }).length;

      const questionable = dailyRecords.filter((r) => {
        const marks = marksBySession.get(r.session_id);
        const hasMark = marks?.has(r.roll_number.toUpperCase());
        return (r.status === "left_after_punch" || r.status === "pending") && !hasMark;
      }).length;

      const absent = dailyRecords.filter(r => r.status === "absent" && !marksBySession.get(r.session_id)?.has(r.roll_number.toUpperCase())).length;

      return {
        day: dayLabel,
        present: verified + unmatched,
        questionable,
        absent,
      };
    });

  const previousWeekVerified = records.filter((record) => {
    const session = sessionMap.get(record.session_id);

    if (!session) {
      return false;
    }

    const ageInDays =
      (Date.now() - new Date(session.session_date).getTime()) / 86_400_000;
    return ageInDays > 7 && ageInDays <= 14 && normalizeStatus(record.status) === "present";
  }).length;

  const currentWeekVerified = records.filter((record) => {
    const session = sessionMap.get(record.session_id);

    if (!session) {
      return false;
    }

    const ageInDays =
      (Date.now() - new Date(session.session_date).getTime()) / 86_400_000;
    return ageInDays >= 0 && ageInDays <= 7 && normalizeStatus(record.status) === "present";
  }).length;

  const enrollmentTrend =
    previousWeekVerified === 0
      ? currentWeekVerified > 0
        ? 100
        : 0
      : roundPercentage(
          ((currentWeekVerified - previousWeekVerified) / previousWeekVerified) * 100,
        );

  const recentStudents = [...records]
    .sort(
      (left, right) =>
        new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime(),
    )
    .slice(0, 6)
    .map((record) => {
      const session = sessionMap.get(record.session_id);
      const classItem = session ? classMap.get(session.class_id) : null;

      return {
        id: record.id,
        name: record.student_name,
        rollNumber: record.roll_number,
        avatarUrl: buildAvatarUrl(record.roll_number),
        time:
          record.punched_at ??
          session?.session_date ??
          new Date(record.updated_at).toLocaleString("en-US"),
        status:
          record.status === "present" || record.status === "late_present"
            ? "verified"
            : record.status === "absent"
              ? "absent"
              : "questionable",
        className: classItem?.name ?? "Unknown class",
      };
    });

  const activeSession = sessions.find(
    (session) =>
      session.session_date === todayIsoDate() && session.review_status !== "finalized",
  );
  const activeClass = activeSession ? classMap.get(activeSession.class_id) : null;
  const activeSessionRecords = activeSession
    ? records.filter((record) => record.session_id === activeSession.id)
    : [];
  const latestSummary = summarizeRecords(latestRecords);

  return {
    stats: {
      score,
      activeClasses: classSummaries.filter((classItem) => classItem.status === "active").length,
      verifiedPresent,
      flaggedToday,
      totalStudents,
      enrollmentTrend,
      breakdown: {
        verified: totalPossible === 0 ? 0 : Math.round((verifiedPresent / totalPossible) * 100),
        questionable: totalPossible === 0 ? 0 : Math.round((flaggedToday / totalPossible) * 100),
        absent:
          totalPossible === 0
            ? 0
            : Math.round(
                (Math.max(0, totalPossible - verifiedPresent - flaggedToday) / totalPossible) * 100,
              ),
      },
    },
    chart: last7Days,
    recentStudents,
    activeSession: activeSession && activeClass
      ? {
          sessionId: activeSession.id,
          classId: activeClass.id,
          className: `${activeClass.code} - ${activeClass.name}`,
          room: activeClass.room ?? "Room not set",
          studentsCount: activeSessionRecords.length,
          markedCount: studentMarks.filter((mark) => mark.session_id === activeSession.id).length,
          timeElapsed: timeElapsedSince(activeSession.created_at),
          isActive: true,
        }
      : {
          sessionId: null,
          classId: null,
          className: "No live session yet",
          room: "Upload a morning punch sheet to begin recheck",
          studentsCount: 0,
          markedCount: 0,
          timeElapsed: "00:00:00",
          isActive: false,
        },
  };
}

export async function getReports(filters: {
  search?: string;
  status?: string;
  classId?: string;
  range?: string;
}) {
  const { classes, sessions, records } = await loadOperationalDataset(120);
  const classMap = new Map(classes.map((classItem) => [classItem.id, classItem]));
  const sessionMap = new Map(sessions.map((session) => [session.id, session]));
  const rangeStart = resolveRangeStart(filters.range);
  const searchTerm = filters.search?.trim().toLowerCase() ?? "";

  const filteredRecords = records.filter((record) => {
    const session = sessionMap.get(record.session_id);

    if (!session) {
      return false;
    }

    if (filters.classId && session.class_id !== filters.classId) {
      return false;
    }

    if (rangeStart && session.session_date < rangeStart) {
      return false;
    }

    if (filters.status && filters.status !== "all") {
      if (normalizeStatus(record.status) !== filters.status) {
        return false;
      }
    }

    if (!searchTerm) {
      return true;
    }

    return (
      record.student_name.toLowerCase().includes(searchTerm) ||
      record.roll_number.toLowerCase().includes(searchTerm)
    );
  });

  const summary = {
    total: filteredRecords.length,
    present: filteredRecords.filter(
      (record) => normalizeStatus(record.status) === "present",
    ).length,
    questionable: filteredRecords.filter(
      (record) => normalizeStatus(record.status) === "questionable",
    ).length,
    absent: filteredRecords.filter((record) => normalizeStatus(record.status) === "absent")
      .length,
  };

  return {
    summary,
    classOptions: classes.map((classItem) => ({
      id: classItem.id,
      label: `${classItem.code} • ${classItem.name}`,
    })),
    records: filteredRecords
      .map((record) => {
        const session = sessionMap.get(record.session_id);
        const classItem = session ? classMap.get(session.class_id) : null;

        return {
          id: record.id,
          student: record.student_name,
          rollNo: record.roll_number,
          classId: classItem?.id ?? "",
          classLabel: classItem
            ? `${classItem.code} • ${classItem.name}`
            : "Unknown class",
          date: session?.session_date ?? "",
          checkIn: record.punched_at ?? "No punch time",
          reviewedAt: record.last_verified_at,
          status: normalizeStatus(record.status),
          rawStatus: record.status,
          note: record.note,
        };
      })
      .sort((left, right) => {
        if (left.date === right.date) {
          return left.student.localeCompare(right.student);
        }

        return right.date.localeCompare(left.date);
      }),
  };
}

export async function getAnalytics() {
  const { classes, sessions, records } = await loadOperationalDataset(180);
  const sessionMap = new Map(sessions.map((session) => [session.id, session]));
  const classMap = new Map(classes.map((classItem) => [classItem.id, classItem]));

  const totalCount = records.length;
  const presentCount = records.filter(
    (record) => normalizeStatus(record.status) === "present",
  ).length;
  const questionableCount = records.filter(
    (record) => normalizeStatus(record.status) === "questionable",
  ).length;
  const absentCount = records.filter((record) => normalizeStatus(record.status) === "absent")
    .length;
  const verifiedRate = totalCount === 0 ? 0 : roundPercentage((presentCount / totalCount) * 100);

  const weeklyTrend = Array.from({ length: 8 }, (_, index) => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() - (7 * (7 - index)));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const label = `W${index + 1}`;
    const weekRecords = records.filter((record) => {
      const session = sessionMap.get(record.session_id);
      if (!session) {
        return false;
      }

      const date = new Date(session.session_date);
      return date >= weekStart && date <= weekEnd;
    });

    const summary = summarizeRecords(weekRecords);
    const total = Math.max(summary.uploadedCount, 1);

    return {
      week: label,
      present: Math.round((summary.verifiedCount / total) * 100),
      questionable: Math.round((summary.questionableCount / total) * 100),
      absent: Math.round((summary.absentCount / total) * 100),
    };
  });

  const dailyCheckins = sessions
    .slice()
    .sort((left, right) => left.session_date.localeCompare(right.session_date))
    .slice(-10)
    .map((session) => ({
      time: new Date(session.session_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      count: records.filter((record) => record.session_id === session.id).length,
    }));

  const classComparison = classes
    .map((classItem) => {
      const classSessions = sessions.filter((session) => session.class_id === classItem.id);
      const classRecords = records.filter((record) =>
        classSessions.some((session) => session.id === record.session_id),
      );
      const summary = summarizeRecords(classRecords);

      return {
        name: classItem.code,
        rate: summary.attendanceRate,
      };
    })
    .sort((left, right) => right.rate - left.rate);

  const pieData = [
    { name: "Verified Present", value: presentCount, color: "hsl(240,73%,62%)" },
    { name: "Needs Review", value: questionableCount, color: "hsl(38,94%,55%)" },
    { name: "Absent", value: absentCount, color: "hsl(4,80%,58%)" },
  ];

  const studentGroups = new Map<
    string,
    {
      name: string;
      rollNo: string;
      classId: string;
      className: string;
      total: number;
      present: number;
      absences: number;
      recentStatuses: AttendanceStatus[];
    }
  >();

  for (const record of records) {
    const session = sessionMap.get(record.session_id);
    if (!session) {
      continue;
    }
    const classItem = classMap.get(session.class_id);
    const key = `${session.class_id}:${record.roll_number}`;
    const current = studentGroups.get(key) ?? {
      name: record.student_name,
      rollNo: record.roll_number,
      classId: session.class_id,
      className: classItem ? classItem.code : "Unknown",
      total: 0,
      present: 0,
      absences: 0,
      recentStatuses: [] as AttendanceStatus[],
    };

    current.total += 1;
    if (normalizeStatus(record.status) === "present") {
      current.present += 1;
    }
    if (normalizeStatus(record.status) === "absent") {
      current.absences += 1;
    }
    current.recentStatuses.unshift(record.status);
    current.recentStatuses = current.recentStatuses.slice(0, 3);
    studentGroups.set(key, current);
  }

  const atRiskStudents = [...studentGroups.values()]
    .map((student) => {
      const rate = student.total === 0 ? 0 : Math.round((student.present / student.total) * 100);
      const recentPresentCount = student.recentStatuses.filter(
        (status) => normalizeStatus(status) === "present",
      ).length;

      return {
        name: student.name,
        rollNo: student.rollNo,
        cls: student.className,
        absences: student.absences,
        rate,
        trend: recentPresentCount >= 2 ? "up" : "down",
      };
    })
    .filter((student) => student.rate < 80)
    .sort((left, right) => left.rate - right.rate)
    .slice(0, 5);

  return {
    kpis: [
      {
        label: "Verified Attendance Rate",
        value: `${verifiedRate}%`,
        change: `${presentCount} confirmed`,
        up: verifiedRate >= 80,
        tone: "primary",
      },
      {
        label: "Punch-And-Leave Flags",
        value: questionableCount.toString(),
        change: `${questionableCount} need review`,
        up: questionableCount === 0,
        tone: "warning",
      },
      {
        label: "At-Risk Students",
        value: atRiskStudents.length.toString(),
        change: "Below 80% attendance",
        up: atRiskStudents.length === 0,
        tone: "destructive",
      },
      {
        label: "Tracked Sessions",
        value: sessions.length.toString(),
        change: `${classes.length} active classes`,
        up: true,
        tone: "success",
      },
    ],
    weeklyTrend,
    dailyCheckins,
    classComparison,
    pieData,
    atRiskStudents,
  };
}
