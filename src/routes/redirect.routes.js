import { Router } from "express";
import { redirectToDestination } from "../controllers/redirect.controllers.js";
import { redirectRateLimit } from "../middleware/rateLimit.middleware.js";

const redirectRouter = Router();

redirectRouter.get("/:slug", redirectRateLimit, redirectToDestination);

export default redirectRouter;
