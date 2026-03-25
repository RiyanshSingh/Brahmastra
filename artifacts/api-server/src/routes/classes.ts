import {
  createClass,
  createClassSchema,
  getLatestSessionForClass,
  importPunchesForClass,
  importPunchesSchema,
  listClasses,
  recheckSchema,
  saveSessionRecheck,
  studentMarkSchema,
  submitStudentMark,
  deleteClass,
} from "../lib/attendance";
import type { RouteDefinition } from "../lib/http";

const classesRoutes: RouteDefinition[] = [
  {
    method: "GET",
    path: "/classes",
    handler: async (_req, res) => {
      const data = await listClasses();
      res.json(data);
    },
  },
  {
    method: "POST",
    path: "/classes",
    handler: async (req, res) => {
      const payload = createClassSchema.parse(req.body);
      const created = await createClass(payload);
      res.json(created, 201);
    },
  },
  {
    method: "GET",
    path: "/classes/:classId/latest-session",
    handler: async (req, res) => {
      const data = await getLatestSessionForClass(req.params.classId ?? "");
      res.json(data);
    },
  },
  {
    method: "POST",
    path: "/classes/:classId/sessions/import-punches",
    handler: async (req, res) => {
      const payload = importPunchesSchema.parse(req.body);
      const data = await importPunchesForClass(req.params.classId ?? "", payload);
      res.json(data, 201);
    },
  },
  {
    method: "POST",
    path: "/sessions/:sessionId/recheck",
    handler: async (req, res) => {
      const payload = recheckSchema.parse(req.body);
      const data = await saveSessionRecheck(req.params.sessionId ?? "", payload);
      res.json(data);
    },
  },
  {
    method: "POST",
    path: "/sessions/:sessionId/student-mark",
    handler: async (req, res) => {
      const payload = studentMarkSchema.parse(req.body);
      const data = await submitStudentMark(req.params.sessionId ?? "", payload);
      res.json(data);
    },
  },
  {
    method: "DELETE",
    path: "/classes/:classId",
    handler: async (req, res) => {
      await deleteClass(req.params.classId ?? "");
      res.json({ success: true });
    },
  },
];

export default classesRoutes;
