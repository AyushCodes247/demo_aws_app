import crypto from "node:crypto";
import redis from "@configs/redis.config.js";

const ACCESS_TOKEN_PREFIX = "access";
const ACCESS_TOKEN_TTL = 20 * 60;

const getAccessToken = (publicId: string) => {
  return `${ACCESS_TOKEN_PREFIX}:${publicId}`;
};

const hashAccessToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const storeAccessToken = async (
  publicId: string,
  accessToken: string,
): Promise<unknown> => {
  return await redis.set(
    getAccessToken(publicId),
    hashAccessToken(accessToken),
    "EX",
    ACCESS_TOKEN_TTL,
  );
};

export const verifyAccessToken = async (
  publicId: string,
  accessToken: string,
): Promise<boolean> => {
  const storedHash = await redis.get(getAccessToken(publicId));

  if (!storedHash) {
    return false;
  }

  return storedHash === hashAccessToken(accessToken);
};

export const deleteAccssToken = async (publicId: string): Promise<unknown> => {
  return await redis.del(getAccessToken(publicId));
};
