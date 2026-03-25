import { Router, type IRouter, type Request, type Response } from "express";
import { getDashboardData } from "../lib/attendance";
import { asyncHandler } from "../lib/http";

const router: IRouter = Router();

router.get(
  "/dashboard",
  asyncHandler(async (req: Request, res: Response) => {
    const data = await getDashboardData();
    res.json(data);
  }),
);

export default router;
