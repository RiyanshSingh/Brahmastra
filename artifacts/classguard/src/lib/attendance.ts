import * as XLSX from "xlsx";
import type { AttendanceStatus, ImportedPunchRow } from "./api";

const HEADER_ALIASES = {
  rollNumber: [
    "rollnumber",
    "rollno",
    "roll",
    "registrationnumber",
    "registrationno",
    "studentid",
    "admissionnumber",
    "admissionno",
    "enrollmentno",
    "enrollmentnumber",
    "enrolmentno",
    "enrolmentnumber",
  ],
  studentName: [
    "studentname",
    "name",
    "fullname",
    "student",
  ],
  punchedAt: [
    "punchtime",
    "punchedat",
    "punchin",
    "time",
    "intime",
    "morningpunch",
  ],
} as const;

function normalizeHeader(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function looksLikeRollNumber(value: string): boolean {
  const compact = value.trim().replace(/\s+/g, "");
  return /^(?=.*\d)[A-Z0-9]{6,}$/.test(compact);
}

function looksLikeName(value: string): boolean {
  const compact = value.trim();
  return /^[A-Z][A-Z\s.'-]{2,}$/i.test(compact) && !looksLikeRollNumber(compact);
}

function pickHeaderIndex(
  row: string[],
  aliases: readonly string[],
): number {
  for (let index = 0; index < row.length; index += 1) {
    if (aliases.includes(normalizeHeader(row[index] ?? ""))) {
      return index;
    }
  }

  return -1;
}

function findHeaderRow(rows: string[][]): {
  headerRowIndex: number;
  rollIndex: number;
  nameIndex: number;
  timeIndex: number;
} | null {
  for (let rowIndex = 0; rowIndex < Math.min(rows.length, 10); rowIndex += 1) {
    const row = rows[rowIndex] ?? [];
    const rollIndex = pickHeaderIndex(row, HEADER_ALIASES.rollNumber);
    const nameIndex = pickHeaderIndex(row, HEADER_ALIASES.studentName);
    const timeIndex = pickHeaderIndex(row, HEADER_ALIASES.punchedAt);

    if (rollIndex >= 0 && nameIndex >= 0) {
      return {
        headerRowIndex: rowIndex,
        rollIndex,
        nameIndex,
        timeIndex,
      };
    }
  }

  return null;
}

export async function parsePunchWorkbook(file: File): Promise<ImportedPunchRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, {
    type: "array",
    cellDates: false,
  });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0] ?? ""];

  if (!firstSheet) {
    throw new Error("The uploaded workbook does not contain any sheets.");
  }

  const rows = XLSX.utils.sheet_to_json<string[]>(firstSheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  if (rows.length === 0) {
    throw new Error("The uploaded workbook is empty.");
  }

  const headerMatch = findHeaderRow(rows);

  if (!headerMatch) {
    throw new Error(
      "We need both a roll number column and a student name column in the sheet.",
    );
  }

  const normalized = rows
    .slice(headerMatch.headerRowIndex + 1)
    .map((row) => {
      let rollNumber = String(row[headerMatch.rollIndex] ?? "").trim().toUpperCase();
      let studentName = String(row[headerMatch.nameIndex] ?? "").trim();
      const punchedAt =
        headerMatch.timeIndex >= 0
          ? String(row[headerMatch.timeIndex] ?? "").trim() || null
          : null;

      // Some attendance exports label the columns correctly in the header row
      // but place the actual name/enrollment values in reversed columns.
      if (looksLikeName(rollNumber) && looksLikeRollNumber(studentName)) {
        const currentRoll = rollNumber;
        rollNumber = studentName.toUpperCase();
        studentName = currentRoll;
      }

      return {
        rollNumber,
        studentName,
        punchedAt,
      };
    })
    .filter((row) => row.rollNumber && row.studentName);

  if (normalized.length === 0) {
    throw new Error("No valid student rows were found in the uploaded workbook.");
  }

  return normalized;
}

export function getStatusLabel(status: AttendanceStatus): string {
  switch (status) {
    case "present":
      return "Verified present";
    case "late_present":
      return "Late but present";
    case "left_after_punch":
      return "Punched and left";
    case "absent":
      return "Absent";
    case "pending":
      return "Pending review";
    default:
      return status;
  }
}

export function getNormalizedStatusLabel(
  status: "verified" | "questionable" | "absent" | "present",
): string {
  switch (status) {
    case "verified":
    case "present":
      return "Present";
    case "questionable":
      return "Needs review";
    case "absent":
      return "Absent";
    default:
      return status;
  }
}
