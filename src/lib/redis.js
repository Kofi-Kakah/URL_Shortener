import { createClient } from "redis";

const redisUrl = (process.env.REDIS_URL ?? "redis://localhost:6379")
	.replace(/^\s*redis-cli\s+-u\s+/i, "")
	.trim();

export const redis = createClient({ url: redisUrl });

let connectionPromise;

redis.on("error", (error) => {
	console.error("Redis client error:", error);
});

export async function connectRedis() {
	if (redis.isReady) return redis;

	if (!connectionPromise) {
		connectionPromise = redis.connect().catch((error) => {
			connectionPromise = undefined;
			throw error;
		});
	}

	await connectionPromise;
	return redis;
}

export async function disconnectRedis() {
	if (redis.isOpen) await redis.quit();
	connectionPromise = undefined;
}
