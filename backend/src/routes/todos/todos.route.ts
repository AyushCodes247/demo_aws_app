import { Router } from "express";
import auth from "@middlewares/auth.middleware.js";
import TodoController from "@controllers/todo/index.controller.js";

const router = Router();

router.get("/stats", auth, TodoController.getStats);
router.get("/", auth, TodoController.getAll);
router.post("/", auth, TodoController.create);
router.get("/:todoId", auth, TodoController.getById);
router.patch("/:todoId/status", auth, TodoController.updateStatus);
router.patch("/:todoId", auth, TodoController.update);
router.delete("/:todoId/delete", auth, TodoController.delete);

export default router;
