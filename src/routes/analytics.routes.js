import { Router } from "express";
import { getUrlAnalytics } from "../controllers/analytics.controllers.js";
import { requireAuth } from "../middleware/require-auth.js";

const analyticsRouter = Router();

analyticsRouter.use(requireAuth);
analyticsRouter.get("/:id", getUrlAnalytics);

export default analyticsRouter;
