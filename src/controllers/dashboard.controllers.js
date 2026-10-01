import { prisma } from "../lib/prisma.js";

/** Provide the signed-in user's summary, links, and latest click activity. */
export async function getDashboard(req, res, next) {
  try {
    const userId = req.auth.userId;
    const now = new Date();
    const [totalLinks, activeLinks, totalClicks, links, recentClicks] = await Promise.all([
      prisma.shortLink.count({ where: { userId } }),
      prisma.shortLink.count({
        where: {
          userId,
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
      }),
      prisma.clickEvent.count({ where: { shortLink: { userId } } }),
      prisma.shortLink.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          slug: true,
          destination: true,
          createdAt: true,
          expiresAt: true,
          isActive: true,
          _count: { select: { clicks: true } },
        },
      }),
      prisma.clickEvent.findMany({
        where: { shortLink: { userId } },
        orderBy: { clickedAt: "desc" },
        take: 10,
        select: {
          id: true,
          clickedAt: true,
          countryCode: true,
          deviceType: true,
          browser: true,
          operatingSystem: true,
          referrer: true,
          shortLink: { select: { id: true, slug: true, destination: true } },
        },
      }),
    ]);

    const baseUrl = (process.env.PUBLIC_BASE_URL ?? `${req.protocol}://${req.get("host")}`)
      .replace(/\/$/, "");
    return res.json({
      dashboard: {
        summary: { totalLinks, activeLinks, totalClicks },
        links: links.map(({ _count, ...link }) => ({
          ...link,
          shortUrl: `${baseUrl}/${link.slug}`,
          clickCount: _count.clicks,
        })),
        recentClicks,
      },
    });
  } catch (error) {
    return next(error);
  }
}
