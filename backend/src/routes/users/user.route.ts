import { Router } from "express";
import UserController from "@controllers/user/index.controller.js";
import auth from "@middlewares/auth.middleware.js";

const router = Router();

router.post("/register", UserController.register);

router.post("/login", UserController.login);

router.post("/logout", auth, UserController.logout);

router.get("/profile", auth, UserController.profile);

export default router;
