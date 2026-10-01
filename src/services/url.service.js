import { randomBytes } from "node:crypto";
import { prisma } from "../lib/prisma.js";

const urlWithClickCount = {
  _count: { select: { clicks: true } },
};

function createSlug() {
  return randomBytes(6).toString("base64url");
}

export async function createShortUrl(userId, { destination, slug, expiresAt }) {
  const attempts = slug ? 1 : 5;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await prisma.shortLink.create({
        data: {
          userId,
          destination,
          slug: slug ?? createSlug(),
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        },
        include: urlWithClickCount,
      });
    } catch (error) {
      if (error?.code !== "P2002" || slug || attempt === attempts - 1) throw error;
    }
  }
}

export function listShortUrls(userId, limit = 50) {
  return prisma.shortLink.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: urlWithClickCount,
  });
}

export function findShortUrl(userId, id) {
  return prisma.shortLink.findFirst({
    where: { id, userId },
    include: urlWithClickCount,
  });
}

export async function updateShortUrl(userId, id, updates) {
  const ownedLink = await prisma.shortLink.findFirst({ where: { id, userId } });
  if (!ownedLink) return null;

  try {
    return await prisma.shortLink.update({
      where: { id },
      data: {
        ...updates,
        ...(updates.expiresAt !== undefined
          ? { expiresAt: updates.expiresAt ? new Date(updates.expiresAt) : null }
          : {}),
      },
      include: urlWithClickCount,
    });
  } catch (error) {
    if (error?.code === "P2025") return null;
    throw error;
  }
}

export async function deleteShortUrl(userId, id) {
  const result = await prisma.shortLink.deleteMany({ where: { id, userId } });
  return result.count > 0;
}
