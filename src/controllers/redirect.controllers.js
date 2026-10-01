import { prisma } from "../lib/prisma.js";
import { getClickMetadata } from "../services/geolip.service.js";

/** Resolve a public short code, record the visit, and send the browser onward. */
export async function redirectToDestination(req, res, next) {
  try {
    const link = await prisma.shortLink.findUnique({
      where: { slug: req.params.slug },
      select: { id: true, destination: true, isActive: true, expiresAt: true },
    });

    if (!link || !link.isActive || (link.expiresAt && link.expiresAt <= new Date())) {
      return res.status(404).json({ error: "Short URL not found." });
    }

    await prisma.clickEvent.create({
      data: {
        shortLinkId: link.id,
        referrer: req.get("referer") || null,
        ...getClickMetadata(req),
      },
    });

    return res.redirect(302, link.destination);
  } catch (error) {
    return next(error);
  }
}
