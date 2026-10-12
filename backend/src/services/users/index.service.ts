import db from "@/index.js";
import { eq } from "drizzle-orm";
import { userTable } from "@schemas/user.schema.js";
import { AppError } from "@utils/essential.util.js";
import {
  generateAccessToken,
  generateRefreshToken,
  hashPassword,
  verifyHashPassword,
  verifyRefreshToken as decodeRefreshToken,
} from "@utils/auth.util.js";
import {
  storeAccessToken,
  verifyRefreshToken as verifyStoredRefreshToken,
  storeRefreshToken,
  deleteAccessToken,
  deleteRefreshToken,
} from "./session.service.js";

interface Payload {
  username?: string;
  email: string;
  password: string;
}

export interface GlobalReturnDataType {
  user: {
    publicId: string;
    username: string;
    email: string;
    createdAt: Date;
  };
  accessToken?: string;
  refreshToken?: string;
}

const isDuplicateEmailError = (error: unknown): boolean => {
  let current = error;

  while (current instanceof Error) {
    const databaseError = current as Error & {
      code?: string;
      constraint?: string;
    };

    if (
      databaseError.code === "23505" &&
      (!databaseError.constraint || databaseError.constraint.includes("email"))
    ) {
      return true;
    }

    current = databaseError.cause;
  }

  return false;
};

class UserService {
  async Register(registerData: Payload): Promise<GlobalReturnDataType> {
    if (!registerData.username?.trim()) {
      throw new AppError("Username is required.", 400);
    }

    const email = registerData.email.trim().toLowerCase();

    const existingUser = await db.query.userTable.findFirst({
      where: eq(userTable.email, email),
    });

    if (existingUser) {
      throw new AppError("User already exists.", 409);
    }

    const hashedPassword = await hashPassword(registerData.password);

    let user;

    try {
      [user] = await db
        .insert(userTable)
        .values({
          username: registerData.username.trim(),
          email,
          passwordHash: hashedPassword,
        })
        .returning({
          publicId: userTable.publicId,
          username: userTable.username,
          email: userTable.email,
          createdAt: userTable.createdAt,
        });
    } catch (error) {
      if (isDuplicateEmailError(error)) {
        throw new AppError("User already exists.", 409);
      }

      throw error;
    }

    if (!user) {
      throw new AppError("Failed to register user.", 500);
    }

    const tokenPayload = {
      publicId: user.publicId,
      username: user.username,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await storeAccessToken(user.publicId, accessToken);
    await storeRefreshToken(user.publicId, refreshToken);

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async login(loginData: Payload): Promise<GlobalReturnDataType> {
    const email = loginData.email.trim().toLowerCase();

    const user = await db.query.userTable.findFirst({
      where: eq(userTable.email, email),
    });

    if (!user) {
      throw new AppError("Invalid email or password.", 401);
    }

    const isValidPassword = await verifyHashPassword(
      user.passwordHash,
      loginData.password,
    );

    if (!isValidPassword) {
      throw new AppError("Invalid email or password.", 401);
    }

    await db
      .update(userTable)
      .set({ lastLoginAt: new Date() })
      .where(eq(userTable.publicId, user.publicId));

    const tokenPayload = {
      publicId: user.publicId,
      username: user.username,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await storeAccessToken(user.publicId, accessToken);
    await storeRefreshToken(user.publicId, refreshToken);

    return {
      user: {
        publicId: user.publicId,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken: string): Promise<GlobalReturnDataType> {
    if (!refreshToken) {
      throw new AppError("Refresh token is required.", 401);
    }

    // First verify the JWT signature and expiry.
    const decoded = await decodeRefreshToken(refreshToken);

    if (
      !decoded ||
      typeof decoded.publicId !== "string" ||
      typeof decoded.username !== "string"
    ) {
      throw new AppError("Invalid refresh token.", 401);
    }

    // Then verify that this token is still the active Redis session.
    const isStoredTokenValid = await verifyStoredRefreshToken(
      decoded.publicId,
      refreshToken,
    );

    if (!isStoredTokenValid) {
      throw new AppError("Refresh session expired or revoked.", 401);
    }

    const user = await db.query.userTable.findFirst({
      where: eq(userTable.publicId, decoded.publicId),
      columns: {
        publicId: true,
        username: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      await Promise.all([
        deleteAccessToken(decoded.publicId),
        deleteRefreshToken(decoded.publicId),
      ]);

      throw new AppError("User no longer exists.", 401);
    }

    const tokenPayload = {
      publicId: user.publicId,
      username: user.username,
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    // Rotate the refresh token and replace the access-token session.
    await storeRefreshToken(user.publicId, newRefreshToken);
    await storeAccessToken(user.publicId, newAccessToken);

    return {
      user,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(publicId: string): Promise<void> {
    await Promise.all([
      deleteAccessToken(publicId),
      deleteRefreshToken(publicId),
    ]);
  }
}

export default new UserService();
