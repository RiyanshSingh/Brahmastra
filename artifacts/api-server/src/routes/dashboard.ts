import { Router, type IRouter } from "express";
import { getDashboardData } from "../lib/attendance";
import { asyncHandler } from "../lib/http";

const router: IRouter = Router();

router.get(
  "/dashboard",
  asyncHandler(async (_req, res) => {
    const data = await getDashboardData();
    res.json(data);
  }),
);

export default router;
