import { Router, type IRouter, type Request, type Response } from "express";
import { getReports } from "../lib/attendance";
import { asyncHandler } from "../lib/http";

const router: IRouter = Router();

router.get(
  "/reports",
  asyncHandler(async (req: Request, res: Response) => {
    const data = await getReports({
      search:
        typeof req.query["search"] === "string" ? req.query["search"] : undefined,
      status:
        typeof req.query["status"] === "string" ? req.query["status"] : undefined,
      classId:
        typeof req.query["classId"] === "string" ? req.query["classId"] : undefined,
      range:
        typeof req.query["range"] === "string" ? req.query["range"] : undefined,
    });
    res.json(data);
  }),
);

export default router;
