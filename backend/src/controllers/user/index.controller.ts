import type { Request, Response, NextFunction } from "express";
import { asyncHandler } from "@utils/essential.util.js";
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
      const { email, password } = req.body;

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
}

export default new UserController();
