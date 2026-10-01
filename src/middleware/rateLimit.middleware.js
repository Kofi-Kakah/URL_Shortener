import { createHash } from "node:crypto";
import { connectRedis } from "../lib/redis.js";

const incrementWindowScript = `
local count = redis.call("INCR", KEYS[1])
if count == 1 then
	redis.call("PEXPIRE", KEYS[1], ARGV[1])
end
return { count, redis.call("PTTL", KEYS[1]) }
`;

function getClientIp(req) {
	return req.ip ?? req.socket?.remoteAddress ?? "unknown";
}

export function createRateLimiter({
	windowMs = 60_000,
	max = 100,
	keyPrefix = "rate-limit",
	keyGenerator = getClientIp,
} = {}) {
	if (!Number.isSafeInteger(windowMs) || windowMs < 1) {
		throw new TypeError("windowMs must be a positive safe integer.");
	}
	if (!Number.isSafeInteger(max) || max < 1) {
		throw new TypeError("max must be a positive safe integer.");
	}

	return async function rateLimit(req, res, next) {
		try {
			const redis = await connectRedis();
			const clientKey = createHash("sha256").update(String(keyGenerator(req))).digest("hex");
			const [countValue, ttlValue] = await redis.eval(incrementWindowScript, {
				keys: [`${keyPrefix}:${clientKey}`],
				arguments: [String(windowMs)],
			});
			const count = Number(countValue);
			const retryAfter = Math.max(1, Math.ceil(Number(ttlValue) / 1000));

			res.set({
				"RateLimit-Limit": String(max),
				"RateLimit-Remaining": String(Math.max(0, max - count)),
				"RateLimit-Reset": String(retryAfter),
			});

			if (count > max) {
				res.set("Retry-After", String(retryAfter));
				return res.status(429).json({ error: "Too many requests. Please try again later." });
			}

			return next();
		} catch (error) {
			return next(error);
		}
	};
}

export const loginRateLimit = createRateLimiter({
	keyPrefix: "rate-limit:login",
	windowMs: 15 * 60_000,
	max: 10,
});

export const registrationRateLimit = createRateLimiter({
	keyPrefix: "rate-limit:registration",
	windowMs: 60 * 60_000,
	max: 5,
});

export const redirectRateLimit = createRateLimiter({
	keyPrefix: "rate-limit:redirect",
	windowMs: 60_000,
	max: 120,
});
