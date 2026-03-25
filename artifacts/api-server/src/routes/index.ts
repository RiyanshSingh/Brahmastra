import type { RouteDefinition } from "../lib/http";
import healthRoutes from "./health";
import dashboardRoutes from "./dashboard";
import classesRoutes from "./classes";
import reportsRoutes from "./reports";
import analyticsRoutes from "./analytics";

const routes: RouteDefinition[] = [
  ...healthRoutes,
  ...dashboardRoutes,
  ...classesRoutes,
  ...reportsRoutes,
  ...analyticsRoutes,
];

export default routes;
