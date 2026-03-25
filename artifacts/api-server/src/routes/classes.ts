import { Router, type IRouter, type Request, type Response } from "express";
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
} from "../lib/attendance";
import { asyncHandler } from "../lib/http";

const router: IRouter = Router();

function getRouteParam(value: string | string[] | undefined): string {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) && value[0]) {
    return value[0];
  }

  return "";
}

router.get(
  "/classes",
  asyncHandler(async (req: Request, res: Response) => {
    const data = await listClasses();
    res.json(data);
  }),
);

router.post(
  "/classes",
  asyncHandler(async (req: Request, res: Response) => {
    const payload = createClassSchema.parse(req.body);
    const created = await createClass(payload);
    res.status(201).json(created);
  }),
);

router.get(
  "/classes/:classId/latest-session",
  asyncHandler(async (req: Request, res: Response) => {
    const data = await getLatestSessionForClass(getRouteParam(req.params.classId));
    res.json(data);
  }),
);

router.post(
  "/classes/:classId/sessions/import-punches",
  asyncHandler(async (req: Request, res: Response) => {
    const payload = importPunchesSchema.parse(req.body);
    const data = await importPunchesForClass(getRouteParam(req.params.classId), payload);
    res.status(201).json(data);
  }),
);

router.post(
  "/sessions/:sessionId/recheck",
  asyncHandler(async (req: Request, res: Response) => {
    const payload = recheckSchema.parse(req.body);
    const data = await saveSessionRecheck(getRouteParam(req.params.sessionId), payload);
    res.json(data);
  }),
);

router.post(
  "/sessions/:sessionId/student-mark",
  asyncHandler(async (req: Request, res: Response) => {
    const payload = studentMarkSchema.parse(req.body);
    const data = await submitStudentMark(getRouteParam(req.params.sessionId), payload);
    res.json(data);
  }),
);

export default router;
