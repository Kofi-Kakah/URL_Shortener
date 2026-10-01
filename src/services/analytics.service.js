import { prisma } from "../lib/prisma.js";

/** Return click totals and recent events for a link owned by the caller. */
export async function findUrlAnalytics(userId, linkId) {
	const link = await prisma.shortLink.findFirst({
		where: { id: linkId, userId },
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

	if (!link) return null;

	const { _count, clicks, ...url } = link;
	return { url, totalClicks: _count.clicks, recentClicks: clicks };
}
