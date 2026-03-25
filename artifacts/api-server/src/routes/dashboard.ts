import { getDashboardData } from "../lib/attendance";
import type { RouteDefinition } from "../lib/http";

const dashboardRoutes: RouteDefinition[] = [
  {
    method: "GET",
    path: "/dashboard",
    handler: async (_req, res) => {
      const data = await getDashboardData();
      res.json(data);
    },
  },
];

export default dashboardRoutes;
