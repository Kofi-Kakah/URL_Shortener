import { authenticateUser, createUser, findUserById } from "../services/auth.service.js";
import { clearAuthCookie, setAuthCookie } from "../utils/auth-cookie.js";

export async function register(req, res, next) {
  try {
    const { user, token } = await createUser(req.validatedBody);
    setAuthCookie(res, token);
    return res.status(201).json({ user });
  } catch (error) {
    if (error?.code === "P2002") {
      return res.status(409).json({ error: "An account with this email already exists." });
    }
    return next(error);
  }
}

export async function login(req, res, next) {
  try {
    const result = await authenticateUser(req.validatedBody);
    if (!result) return res.status(401).json({ error: "Invalid email or password." });

    setAuthCookie(res, result.token);
    return res.json({ user: result.user });
  } catch (error) {
    return next(error);
  }
}

export function logout(_req, res) {
  clearAuthCookie(res);
  return res.status(204).end();
}

export async function getCurrentUser(req, res, next) {
  try {
    const user = await findUserById(req.auth.userId);
    if (!user) return res.status(401).json({ error: "Authentication required." });
    return res.json({ user });
  } catch (error) {
    return next(error);
  }
}
