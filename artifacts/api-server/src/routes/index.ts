import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import classesRouter from "./classes";
import reportsRouter from "./reports";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(classesRouter);
router.use(reportsRouter);
router.use(analyticsRouter);

export default router;
