import db from "@/index.js";
import { eq } from "drizzle-orm";
import { userTable } from "@schemas/user.schema.js";
import { AppError } from "@utils/essential.util.js";
import {
  generateAccessToken,
  generateRefreshToken,
  hashPassword,
  verifyHashPassword,
} from "@utils/auth.util.js";
import { storeAccessToken, deleteAccssToken } from "./session.service.js";

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

class UserService {
  async Register(registerData: Payload): Promise<GlobalReturnDataType> {
    const existingUser = await db.query.userTable.findFirst({
      where: eq(userTable.email, registerData.email),
    });

    if (existingUser) {
      throw new AppError("user already exists.", 409);
    }

    const hashedPassword = await hashPassword(registerData.password);

    const [user] = await db
      .insert(userTable)
      .values({
        username: registerData.username!,
        email: registerData.email,
        passwordHash: hashedPassword,
      })
      .returning({
        publicId: userTable.publicId,
        username: userTable.username,
        email: userTable.email,
        createdAt: userTable.createdAt,
      });

    if (!user) {
      throw new AppError("failed to register user.", 500);
    }

    const payload = {
      publicId: user.publicId,
      username: user.username,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await storeAccessToken(user.publicId, accessToken);

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async login(loginData: Payload): Promise<GlobalReturnDataType> {
    const user = await db.query.userTable.findFirst({
      where: eq(userTable.email, loginData.email),
    });

    if (!user) {
      throw new AppError("invalid email or password.", 401);
    }

    const isValidPassword = await verifyHashPassword(
      user.passwordHash,
      loginData.password,
    );

    if (!isValidPassword) {
      throw new AppError("invalid email or password.", 401);
    }

    await db
      .update(userTable)
      .set({
        lastLoginAt: new Date(),
      })
      .where(eq(userTable.publicId, user.publicId));

    const payload = {
      publicId: user.publicId,
      username: user.username,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await storeAccessToken(user.publicId, accessToken);

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

  async logout(publicId: string): Promise<unknown> {
    return await deleteAccssToken(publicId);
  }
}

export default new UserService();
