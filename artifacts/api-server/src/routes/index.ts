import type { RouteDefinition } from "../lib/http";
import healthRoutes from "./health";
import dashboardRoutes from "./dashboard";
import classesRoutes from "./classes";
import reportsRoutes from "./reports";
import analyticsRoutes from "./analytics";

import authRoutes from "./auth";

const routes: RouteDefinition[] = [
  ...healthRoutes,
  ...authRoutes,
  ...dashboardRoutes,
  ...classesRoutes,
  ...reportsRoutes,
  ...analyticsRoutes,
];

export default routes;
