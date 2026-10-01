import { Router } from "express";
import { redirectToDestination } from "../controllers/redirect.controllers.js";

const redirectRouter = Router();

redirectRouter.get("/:slug", redirectToDestination);

export default redirectRouter;
