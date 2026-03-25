import { HealthCheckResponse } from "../shared/api-zod";
import type { RouteDefinition } from "../lib/http";

const healthRoutes: RouteDefinition[] = [
  {
    method: "GET",
    path: "/healthz",
    handler: (_req, res) => {
      const data = HealthCheckResponse.parse({ status: "ok" });
      res.json(data);
    },
  },
];

export default healthRoutes;
