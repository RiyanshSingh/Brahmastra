import { getAnalytics } from "../lib/attendance";
import type { RouteDefinition } from "../lib/http";

const analyticsRoutes: RouteDefinition[] = [
  {
    method: "GET",
    path: "/analytics",
    handler: async (_req, res) => {
      const data = await getAnalytics();
      res.json(data);
    },
  },
];

export default analyticsRoutes;
