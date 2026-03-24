import { Router, type IRouter } from "express";
import { getAnalytics } from "../lib/attendance";
import { asyncHandler } from "../lib/http";

const router: IRouter = Router();

router.get(
  "/analytics",
  asyncHandler(async (_req, res) => {
    const data = await getAnalytics();
    res.json(data);
  }),
);

export default router;
