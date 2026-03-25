import { Router, type IRouter, type Request, type Response } from "express";
import { getAnalytics } from "../lib/attendance";
import { asyncHandler } from "../lib/http";

const router: IRouter = Router();

router.get(
  "/analytics",
  asyncHandler(async (req: Request, res: Response) => {
    const data = await getAnalytics();
    res.json(data);
  }),
);

export default router;
