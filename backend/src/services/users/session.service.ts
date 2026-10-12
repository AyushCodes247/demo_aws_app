import crypto from "node:crypto";
import redis from "@configs/redis.config.js";

const ACCESS_TOKEN_PREFIX = "access";
const REFRESH_TOKEN_PREFIX = "refresh";

const ACCESS_TOKEN_TTL = 20 * 60; // 20 minutes
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days

const getAccessTokenKey = (publicId: string): string => {
  return `${ACCESS_TOKEN_PREFIX}:${publicId}`;
};

const getRefreshTokenKey = (publicId: string): string => {
  return `${REFRESH_TOKEN_PREFIX}:${publicId}`;
};

const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const storeAccessToken = async (
  publicId: string,
  accessToken: string,
): Promise<unknown> => {
  return redis.set(
    getAccessTokenKey(publicId),
    hashToken(accessToken),
    "EX",
    ACCESS_TOKEN_TTL,
  );
};

export const verifyAccessToken = async (
  publicId: string,
  accessToken: string,
): Promise<boolean> => {
  const storedHash = await redis.get(getAccessTokenKey(publicId));

  if (!storedHash) {
    return false;
  }

  return storedHash === hashToken(accessToken);
};

export const deleteAccessToken = async (publicId: string): Promise<number> => {
  return redis.del(getAccessTokenKey(publicId));
};

export const storeRefreshToken = async (
  publicId: string,
  refreshToken: string,
): Promise<unknown> => {
  return redis.set(
    getRefreshTokenKey(publicId),
    hashToken(refreshToken),
    "EX",
    REFRESH_TOKEN_TTL,
  );
};

export const verifyRefreshToken = async (
  publicId: string,
  refreshToken: string,
): Promise<boolean> => {
  const storedHash = await redis.get(getRefreshTokenKey(publicId));

  if (!storedHash) {
    return false;
  }

  return storedHash === hashToken(refreshToken);
};

export const deleteRefreshToken = async (publicId: string): Promise<number> => {
  return redis.del(getRefreshTokenKey(publicId));
};
