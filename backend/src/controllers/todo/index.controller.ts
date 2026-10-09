import type { Request, Response } from "express";
import { asyncHandler, AppError } from "@utils/essential.util.js";
import TodoService from "@services/todos/index.service.js";

class TodoController {
  create = asyncHandler(
    async (req: Request, res: Response): Promise<unknown> => {
      const { publicId } = req.user!;

      const { topicName, description } = req.body;

      const todo = await TodoService.create({
        topicName,
        description,
        userPublicId: publicId,
      });

      return res.status(201).json({
        success: true,
        message: "todo created successfully.",
        todo,
      });
    },
  );

  getAll = asyncHandler(
    async (req: Request, res: Response): Promise<unknown> => {
      const { publicId } = req.user!;

      const todos = await TodoService.getAll(publicId);

      return res.status(200).json({
        success: true,
        message: "todos fetched successfully.",
        todos,
      });
    },
  );

  getById = asyncHandler(
    async (req: Request, res: Response): Promise<unknown> => {
      const { publicId } = req.user!;
      const todoId = req.params.todoId;

      if (typeof todoId !== "string") {
        throw new AppError("Invalid Todo ID.", 400);
      }

      const todo = await TodoService.getById(publicId, todoId);

      return res.status(200).json({
        success: true,
        message: "todo fetched successfully.",
        todo,
      });
    },
  );

  update = asyncHandler(
    async (req: Request, res: Response): Promise<unknown> => {
      const { publicId } = req.user!;
      const todoId = req.params.todoId;

      if (typeof todoId !== "string") {
        throw new AppError("Invalid Todo ID.", 400);
      }

      const todo = await TodoService.update(publicId, todoId, req.body);

      return res.status(200).json({
        success: true,
        message: "todo updated successfully.",
        todo,
      });
    },
  );

  updateStatus = asyncHandler(
    async (req: Request, res: Response): Promise<unknown> => {
      const { publicId } = req.user!;
      const todoId = req.params.todoId;

      if (typeof todoId !== "string") {
        throw new AppError("Invalid Todo ID.", 400);
      }

      const { status } = req.body;

      const todo = await TodoService.updateStatus(publicId, todoId, status);

      return res.status(200).json({
        success: true,
        message: "todo status updated successfully.",
        todo,
      });
    },
  );

  delete = asyncHandler(
    async (req: Request, res: Response): Promise<unknown> => {
      const { publicId } = req.user!;
      const todoId = req.params.todoId;

      if (typeof todoId !== "string") {
        throw new AppError("Invalid Todo ID.", 400);
      }

      await TodoService.delete(publicId, todoId);

      return res.status(200).json({
        success: true,
        message: "todo deleted successfully.",
      });
    },
  );

  getStats = asyncHandler(
    async (req: Request, res: Response): Promise<unknown> => {
      const { publicId } = req.user!;

      const stats = await TodoService.getStats(publicId);

      return res.status(200).json({
        success: true,
        message: "todo statistics fetched successfully.",
        stats,
      });
    },
  );
}

export default new TodoController();
