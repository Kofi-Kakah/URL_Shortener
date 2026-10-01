import { Router } from "express";
import {
  createUrl,
  deleteUrl,
  getUrl,
  listUrls,
  updateUrl,
} from "../controllers/url.controllers.js";
import { requireAuth } from "../middleware/require-auth.js";
import { validateBody } from "../middleware/validate-request.js";
import { createUrlSchema, updateUrlSchema } from "../validators/url.schemas.js";

const urlRouter = Router();

urlRouter.use(requireAuth);
urlRouter.post("/", validateBody(createUrlSchema), createUrl);
urlRouter.get("/", listUrls);
urlRouter.get("/:id", getUrl);
urlRouter.patch("/:id", validateBody(updateUrlSchema), updateUrl);
urlRouter.delete("/:id", deleteUrl);

export default urlRouter;
