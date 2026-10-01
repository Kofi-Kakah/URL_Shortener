import { findUrlAnalytics } from "../services/analytics.service.js";

/** Return click totals and recent events for a link owned by the caller. */
export async function getUrlAnalytics(req, res, next) {
  try {
    const analytics = await findUrlAnalytics(req.auth.userId, req.params.id);
    if (!analytics) return res.status(404).json({ error: "URL not found." });
    return res.json({ analytics });
  } catch (error) {
    return next(error);
  }
}
