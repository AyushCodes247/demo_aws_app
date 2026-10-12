import { Redis } from "ioredis";
import env from "./env.config.js";
import logger from "@utils/logger.util.js";

const redis = new Redis({
  host: env.REDIS_HOST,
  password: env.REDIS_PASSWORD,
  port: env.REDIS_PORT,

  maxRetriesPerRequest: 3,

  lazyConnect: true,

  enableReadyCheck: true,

  maxLoadingRetryTime: 1_000,
});

redis.on("connect", (): void => {
  logger.info("redis connected successfully.");
});

redis.on("ready", (): void => {
  logger.info("redis is ready.");
});

redis.on("error", (error: unknown): void => {
  console.error(`Redis error.:${error}`);
});

export default redis;
