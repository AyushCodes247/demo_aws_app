import type { Request, Response, NextFunction } from "express";
import { asyncHandler, AppError } from "@utils/essential.util.js";
import UserService from "@services/users/index.service.js";
import env from "@configs/env.config.js";

const REFRESH_COOKIE = "todo_cookie";

class UserController {
  register = asyncHandler(
    async (
      req: Request,
      res: Response,
      _next: NextFunction,
    ): Promise<unknown> => {
      const { username, email, password } = req.body;

      const isValidEmail = (value: string): boolean =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

      if (
        typeof username !== "string" ||
        typeof email !== "string" ||
        typeof password !== "string" ||
        !username.trim() ||
        !email.trim() ||
        !password ||
        !isValidEmail(email)
      ) {
        throw new AppError("Invalid registration input.", 400);
      }

      const { user, accessToken, refreshToken } = await UserService.Register({
        username,
        email,
        password,
      });

      const isProduction = env.NODE_ENV === "production";

      res.cookie(REFRESH_COOKIE, refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
      });

      return res.status(201).json({
        success: true,
        message: "User registered successfully.",
        user,
        accessToken,
      });
    },
  );

  login = asyncHandler(
    async (
      req: Request,
      res: Response,
      _next: NextFunction,
    ): Promise<unknown> => {
      const body: unknown = req.body;

      if (typeof body !== "object" || body === null || Array.isArray(body)) {
        throw new AppError("A valid JSON request body is required.", 400);
      }

      const { email, password } = body as Record<string, unknown>;

      if (
        typeof email !== "string" ||
        typeof password !== "string" ||
        !email.trim() ||
        !password
      ) {
        throw new AppError("Invalid login input.", 400);
      }

      const { user, accessToken, refreshToken } = await UserService.login({
        email,
        password,
      });

      const isProduction = env.NODE_ENV === "production";

      res.cookie(REFRESH_COOKIE, refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
      });

      return res.status(200).json({
        success: true,
        message: "User logged in successfully.",
        user,
        accessToken,
      });
    },
  );

  profile = asyncHandler(
    async (
      req: Request,
      res: Response,
      _next: NextFunction,
    ): Promise<unknown> => {
      return res.status(200).json({
        success: true,
        message: "profile fetched successfully.",
        user: {
          publicId: req.user!.publicId,
          username: req.user!.username,
          email: req.user!.email,
          createdAt: req.user!.createdAt,
        },
      });
    },
  );

  logout = asyncHandler(
    async (
      req: Request,
      res: Response,
      _next: NextFunction,
    ): Promise<unknown> => {
      const { publicId } = req.user!;

      await UserService.logout(publicId);

      return res.status(200).json({
        success: true,
        message: "logged out successfully.",
      });
    },
  );

  refresh = asyncHandler(
    async (
      req: Request,
      res: Response,
      _next: NextFunction,
    ): Promise<unknown> => {
      const refreshToken = req.cookies?.todo_cookie;

      if (typeof refreshToken !== "string" || !refreshToken) {
        throw new AppError("Refresh session required.", 401);
      }

      const result = await UserService.refresh(refreshToken);

      res.cookie(REFRESH_COOKIE, result.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
      });

      return res.status(200).json({
        success: true,
        message: "Session refreshed successfully.",
        user: result.user,
        accessToken: result.accessToken,
      });
    },
  );
}

export default new UserController();
