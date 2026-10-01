import { prisma } from "../lib/prisma.js";

/** Return click totals and recent events for a link owned by the caller. */
export async function getUrlAnalytics(req, res, next) {
  try {
    const link = await prisma.shortLink.findFirst({
      where: { id: req.params.id, userId: req.auth.userId },
      select: {
        id: true,
        slug: true,
        destination: true,
        _count: { select: { clicks: true } },
        clicks: {
          orderBy: { clickedAt: "desc" },
          take: 100,
          select: {
            clickedAt: true,
            countryCode: true,
            deviceType: true,
            browser: true,
            operatingSystem: true,
            referrer: true,
          },
        },
      },
    });

    if (!link) return res.status(404).json({ error: "URL not found." });

    const { _count, ...url } = link;
    return res.json({ analytics: { url, totalClicks: _count.clicks, recentClicks: link.clicks } });
  } catch (error) {
    return next(error);
  }
}
