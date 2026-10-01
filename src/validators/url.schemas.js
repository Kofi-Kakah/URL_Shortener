import { z } from "zod";

const httpUrl = z.string().url().refine((value) => {
  const protocol = new URL(value).protocol;
  return protocol === "http:" || protocol === "https:";
}, "URL must use http or https");

const slug = z.string().trim().min(3).max(32).regex(/^[A-Za-z0-9_-]+$/);

export const createUrlSchema = z.object({
  destination: httpUrl,
  slug: slug.optional(),
  expiresAt: z.string().datetime().optional(),
});

export const updateUrlSchema = z.object({
  destination: httpUrl.optional(),
  slug: slug.optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  isActive: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, "Provide at least one field to update");
