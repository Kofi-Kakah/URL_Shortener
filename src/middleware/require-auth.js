import { verifyAuthToken } from "../services/auth.service.js";

export function requireAuth(req, res, next) {
  const bearerToken = req.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  const token = req.cookies?.auth_token ?? bearerToken;
  if (!token) return res.status(401).json({ error: "Authentication required." });

  try {
    const auth = verifyAuthToken(token);
    if (!auth) {
      return res.status(401).json({ error: "Invalid or expired authentication token." });
    }
    req.auth = auth;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired authentication token." });
  }
}
