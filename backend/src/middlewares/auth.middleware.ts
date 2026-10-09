import type { Request, Response, NextFunction } from "express";
import { asyncHandler, AppError } from "@utils/essential.util.js";
import { verifyAccessToken as verifyJWT } from "@utils/auth.util.js";
import { verifyAccessToken as verifyRedisAccessToken } from "@services/users/session.service.js";
import db from "@/index.js";
import { userTable } from "@schemas/user.schema.js";
import { eq } from "drizzle-orm";
import {
  cacheProfile,
  getCachedProfile,
} from "@services/users/profileCache.service.js";

interface CachedProfile {
  publicId: string;
  username: string;
  email: string;
  createdAt: string | Date;
}

const auth = asyncHandler(
  async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<unknown> => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new AppError("Unauthorized", 401);
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new AppError("Unauthorized", 401);
    }

    let payload;

    try {
      payload = verifyJWT(token);
    } catch {
      throw new AppError("Unauthorized", 401);
    }

    const isValidSession = await verifyRedisAccessToken(
      payload.publicId,
      token,
    );

    if (!isValidSession) {
      throw new AppError("Unauthorized", 401);
    }

    const cachedProfile = await getCachedProfile(payload.publicId);

    if (cachedProfile) {
      const user: CachedProfile = JSON.parse(cachedProfile);
      req.user = {
        publicId: user.publicId,
        username: user.username,
        email: user.email,
        createdAt: new Date(user.createdAt),
      };
      return next();
    }

    const user = await db.query.userTable.findFirst({
      where: eq(userTable.publicId, payload.publicId),
      columns: {
        publicId: true,
        username: true,
        email: true,
        isVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError("Unauthorized", 401);
    }

    await cacheProfile(payload.publicId, {
      publicId: user.publicId,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    });

    req.user = {
      publicId: user.publicId,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    };

    return next();
  },
);

export default auth;
