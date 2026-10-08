import { Router } from "express";
import userRouter from "./users/user.route.js";
import todoRouter from "./todos/todos.route.js";

const router = Router();

router.use("/users", userRouter);

router.use("/todos", todoRouter);

export default router;
