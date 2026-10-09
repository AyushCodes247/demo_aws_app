import { Types } from "mongoose";
import { AppError } from "@utils/essential.util.js";
import { Todo } from "@models/todo.model.js";
import {
  getCachedTodoList,
  cacheTodoList,
  getCachedTodo,
  cacheTodo,
  getCachedTodoStats,
  cacheTodoStats,
  invalidateTodoCache,
} from "./todoCache.service.js";

import type { StatusEnum } from "@models/todo.model.js";

interface ToDoRequestBody {
  topicName: string;
  description?: string;
  userPublicId: string;
}

interface UpdateTodoPayload {
  topicName?: string;
  description?: string;
  dueAt?: Date | string | null;
  reminderAt?: Date | string | null;
}

interface TodoResponse {
  id: string;
  topicName: string;
  description: string;
  status: StatusEnum;
  dueAt: Date | null;
  reminderAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface TodoStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
}

const VALID_STATUSES: StatusEnum[] = ["Pending", "Processing", "Completed"];

class ToDoService {
  private validateTodoId(todoId: string): void {
    if (!Types.ObjectId.isValid(todoId)) {
      throw new AppError("Invalid Todo ID.", 400);
    }
  }

  private toResponse(todo: any): TodoResponse {
    return {
      id: String(todo._id),
      topicName: todo.topicName,
      description: todo.description,
      status: todo.status,
      dueAt: todo.dueAt,
      reminderAt: todo.reminderAt,
      createdAt: todo.createdAt,
      updatedAt: todo.updatedAt,
    };
  }

  async create(
    creationPayload: ToDoRequestBody,
  ): Promise<
    Omit<TodoResponse, "dueAt" | "reminderAt" | "createdAt" | "updatedAt">
  > {
    const topicName = creationPayload.topicName?.trim();
    const description = creationPayload.description?.trim() ?? "";

    if (!topicName || topicName.length < 3) {
      throw new AppError("Topic name must be at least 3 characters long.", 400);
    }

    if (!creationPayload.userPublicId) {
      throw new AppError("Unauthorized", 401);
    }

    const alreadyExistsTodo = await Todo.exists({
      userPublicId: creationPayload.userPublicId,
      topicName,
      deletedAt: null,
    });

    if (alreadyExistsTodo) {
      throw new AppError("Todo already exists.", 409);
    }

    const todo = await Todo.create({
      userPublicId: creationPayload.userPublicId,
      topicName,
      description,
    });

    await invalidateTodoCache(creationPayload.userPublicId);

    return {
      id: String(todo._id),
      topicName: todo.topicName,
      description: todo.description,
      status: todo.status,
    };
  }

  async getAll(userPublicId: string): Promise<TodoResponse[]> {
    const cached = await getCachedTodoList(userPublicId);

    if (cached) {
      return JSON.parse(cached) as TodoResponse[];
    }

    const todos = await Todo.find({
      userPublicId,
      deletedAt: null,
    })
      .sort({ createdAt: -1 })
      .lean();

    const response = todos.map((todo) => this.toResponse(todo));

    await cacheTodoList(userPublicId, response);

    return response;
  }

  async getById(userPublicId: string, todoId: string): Promise<TodoResponse> {
    this.validateTodoId(todoId);

    const cached = await getCachedTodo(userPublicId, todoId);

    if (cached) {
      return JSON.parse(cached) as TodoResponse;
    }

    const todo = await Todo.findOne({
      _id: todoId,
      userPublicId,
      deletedAt: null,
    }).lean();

    if (!todo) {
      throw new AppError("Todo not found.", 404);
    }

    const response = this.toResponse(todo);

    await cacheTodo(userPublicId, todoId, response);

    return response;
  }

  async update(
    userPublicId: string,
    todoId: string,
    payload: UpdateTodoPayload,
  ): Promise<TodoResponse> {
    this.validateTodoId(todoId);

    const updates: Record<string, unknown> = {};

    if (payload.topicName !== undefined) {
      const topicName = payload.topicName.trim();

      if (topicName.length < 3) {
        throw new AppError(
          "Topic name must be at least 3 characters long.",
          400,
        );
      }

      updates.topicName = topicName;
    }

    if (payload.description !== undefined) {
      updates.description = payload.description.trim();
    }

    for (const field of ["dueAt", "reminderAt"] as const) {
      if (payload[field] !== undefined) {
        const value = payload[field];

        if (value === null) {
          updates[field] = null;
        } else {
          const date = new Date(value);

          if (Number.isNaN(date.getTime())) {
            throw new AppError(`Invalid ${field} date.`, 400);
          }

          updates[field] = date;
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      throw new AppError("No valid fields provided to update.", 400);
    }

    const todo = await Todo.findOneAndUpdate(
      { _id: todoId, userPublicId, deletedAt: null },
      { $set: updates },
      { new: true, runValidators: true },
    ).lean();

    if (!todo) {
      throw new AppError("Todo not found.", 404);
    }

    await invalidateTodoCache(userPublicId, todoId);

    return this.toResponse(todo);
  }

  async updateStatus(
    userPublicId: string,
    todoId: string,
    status: StatusEnum,
  ): Promise<TodoResponse> {
    this.validateTodoId(todoId);

    if (!VALID_STATUSES.includes(status)) {
      throw new AppError("Invalid Todo status.", 400);
    }

    const todo = await Todo.findOneAndUpdate(
      { _id: todoId, userPublicId, deletedAt: null },
      { $set: { status } },
      { new: true, runValidators: true },
    ).lean();

    if (!todo) {
      throw new AppError("Todo not found.", 404);
    }

    await invalidateTodoCache(userPublicId, todoId);

    return this.toResponse(todo);
  }

  async delete(userPublicId: string, todoId: string): Promise<void> {
    this.validateTodoId(todoId);

    const todo = await Todo.findOneAndUpdate(
      { _id: todoId, userPublicId, deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true },
    );

    if (!todo) {
      throw new AppError("Todo not found.", 404);
    }

    await invalidateTodoCache(userPublicId, todoId);
  }

  async getStats(userPublicId: string): Promise<TodoStats> {
    const cached = await getCachedTodoStats(userPublicId);

    if (cached) {
      return JSON.parse(cached) as TodoStats;
    }

    const [stats] = await Todo.aggregate<TodoStats>([
      { $match: { userPublicId, deletedAt: null } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: {
            $sum: {
              $cond: [{ $eq: ["$status", "Pending"] }, 1, 0],
            },
          },
          processing: {
            $sum: {
              $cond: [{ $eq: ["$status", "Processing"] }, 1, 0],
            },
          },
          completed: {
            $sum: {
              $cond: [{ $eq: ["$status", "Completed"] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          total: 1,
          pending: 1,
          processing: 1,
          completed: 1,
        },
      },
    ]);

    const response: TodoStats = stats ?? {
      total: 0,
      pending: 0,
      processing: 0,
      completed: 0,
    };

    await cacheTodoStats(userPublicId, response);

    return response;
  }
}

export default new ToDoService();
