import { Router } from "express";
import { getCurrentUser, login, logout, register } from "../controllers/auth.controllers.js";
import { requireAuth } from "../middleware/require-auth.js";
import { validateBody } from "../middleware/validate-request.js";
import { loginSchema, registrationSchema } from "../validators/auth.schemas.js";

const authRouter = Router();

authRouter.post("/register", validateBody(registrationSchema), register);
authRouter.post("/login", validateBody(loginSchema), login);
authRouter.post("/logout", logout);
authRouter.get("/me", requireAuth, getCurrentUser);

export default authRouter;
