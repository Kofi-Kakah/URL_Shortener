import { Router } from "express";
import { getDashboard } from "../controllers/dashboard.controllers.js";
import { requireAuth } from "../middleware/require-auth.js";

const dashboardRouter = Router();

dashboardRouter.use(requireAuth);
dashboardRouter.get("/", getDashboard);

export default dashboardRouter;
