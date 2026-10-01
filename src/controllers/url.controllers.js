import {
  createShortUrl,
  deleteShortUrl,
  findShortUrl,
  listShortUrls,
  updateShortUrl,
} from "../services/url.service.js";

function serializeShortUrl(link, req) {
  const { _count, ...fields } = link;
  const baseUrl = (process.env.PUBLIC_BASE_URL ?? `${req.protocol}://${req.get("host")}`)
    .replace(/\/$/, "");

  return {
    ...fields,
    shortUrl: `${baseUrl}/${link.slug}`,
    clickCount: _count.clicks,
  };
}

function handleSlugConflict(error, res, next) {
  if (error?.code === "P2002") {
    return res.status(409).json({ error: "That short URL slug is already in use." });
  }
  return next(error);
}

export async function createUrl(req, res, next) {
  try {
    const link = await createShortUrl(req.auth.userId, req.validatedBody);
    return res.status(201).json({ url: serializeShortUrl(link, req) });
  } catch (error) {
    return handleSlugConflict(error, res, next);
  }
}

export async function listUrls(req, res, next) {
  try {
    const links = await listShortUrls(req.auth.userId);
    return res.json({ urls: links.map((link) => serializeShortUrl(link, req)) });
  } catch (error) {
    return next(error);
  }
}

export async function getUrl(req, res, next) {
  try {
    const link = await findShortUrl(req.auth.userId, req.params.id);
    if (!link) return res.status(404).json({ error: "URL not found." });
    return res.json({ url: serializeShortUrl(link, req) });
  } catch (error) {
    return next(error);
  }
}

export async function updateUrl(req, res, next) {
  try {
    const link = await updateShortUrl(req.auth.userId, req.params.id, req.validatedBody);
    if (!link) return res.status(404).json({ error: "URL not found." });
    return res.json({ url: serializeShortUrl(link, req) });
  } catch (error) {
    return handleSlugConflict(error, res, next);
  }
}

export async function deleteUrl(req, res, next) {
  try {
    const deleted = await deleteShortUrl(req.auth.userId, req.params.id);
    if (!deleted) return res.status(404).json({ error: "URL not found." });
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
}
