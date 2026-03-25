import { getReports } from "../lib/attendance";
import type { RouteDefinition } from "../lib/http";

const reportsRoutes: RouteDefinition[] = [
  {
    method: "GET",
    path: "/reports",
    handler: async (req, res) => {
      const data = await getReports({
        search: req.query.get("search") ?? undefined,
        status: req.query.get("status") ?? undefined,
        classId: req.query.get("classId") ?? undefined,
        range: req.query.get("range") ?? undefined,
      });
      res.json(data);
    },
  },
];

export default reportsRoutes;
