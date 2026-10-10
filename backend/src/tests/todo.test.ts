import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Request, Response, NextFunction } from "express";
import TodoController from "@controllers/todo/index.controller.js";
import TodoService from "@services/todos/index.service.js";
import type { StatusEnum } from "@models/todo.model.js";

jest.mock("@services/todos/index.service.js", () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    getAll: jest.fn(),
    getById: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    delete: jest.fn(),
    getStats: jest.fn(),
  },
}));

const mockedTodoService = jest.mocked(TodoService);

const createRequest = (overrides: Record<string, unknown> = {}) =>
  ({
    user: { publicId: "user-123" },
    params: {},
    body: {},
    ...overrides,
  }) as Request;

const createResponse = () => {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  };

  res.status.mockReturnValue(res);

  return res as unknown as Response & {
    status: jest.Mock;
    json: jest.Mock;
  };
};

const next: NextFunction = jest.fn(
  (...args: unknown[]) => undefined,
) as NextFunction;

const invokeController = async (
  controller: (req: Request, res: Response, next: NextFunction) => unknown,
  req: Request,
  res: Response,
) => {
  await controller(req, res, next);
};

describe("TodoController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(next).mockClear();
  });

  describe("create", () => {
    it("should create a todo and return 201", async () => {
      const todo: {
        id: string;
        topicName: string;
        description: string;
        status: StatusEnum;
      } = {
        id: "todo-123",
        topicName: "Learn AWS",
        description: "Learn AWS services",
        status: "Pending",
      };

      mockedTodoService.create.mockResolvedValue(todo);

      const req = createRequest({
        body: {
          topicName: "Learn AWS",
          description: "Learn AWS services",
        },
      });

      const res = createResponse();

      await invokeController(TodoController.create, req, res);

      expect(mockedTodoService.create).toHaveBeenCalledWith({
        topicName: "Learn AWS",
        description: "Learn AWS services",
        userPublicId: "user-123",
      });

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "todo created successfully.",
        todo,
      });
    });

    it("should pass an error to next when creation fails", async () => {
      mockedTodoService.create.mockRejectedValue(
        new Error("Todo already exists."),
      );

      const req = createRequest({
        body: {
          topicName: "Learn AWS",
          description: "Learn AWS services",
        },
      });

      const res = createResponse();

      await invokeController(TodoController.create, req, res);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Todo already exists.",
        }),
      );

      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("getAll", () => {
    it("should fetch all todos and return 200", async () => {
      const todos = [
        {
          id: "todo-123",
          topicName: "Learn AWS",
          description: "Learn AWS services",
          status: "Pending",
        },
      ];

      mockedTodoService.getAll.mockResolvedValue(todos as never);

      const req = createRequest();
      const res = createResponse();

      await invokeController(TodoController.getAll, req, res);

      expect(mockedTodoService.getAll).toHaveBeenCalledWith("user-123");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "todos fetched successfully.",
        todos,
      });
    });

    it("should pass an error to next when fetching todos fails", async () => {
      mockedTodoService.getAll.mockRejectedValue(new Error("Database error."));

      const req = createRequest();
      const res = createResponse();

      await invokeController(TodoController.getAll, req, res);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Database error.",
        }),
      );

      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("getById", () => {
    it("should fetch a todo by ID and return 200", async () => {
      const todo = {
        id: "507f1f77bcf86cd799439011",
        topicName: "Learn AWS",
        description: "Learn AWS services",
        status: "Pending",
      };

      mockedTodoService.getById.mockResolvedValue(todo as never);

      const req = createRequest({
        params: { todoId: "507f1f77bcf86cd799439011" },
      });

      const res = createResponse();

      await invokeController(TodoController.getById, req, res);

      expect(mockedTodoService.getById).toHaveBeenCalledWith(
        "user-123",
        "507f1f77bcf86cd799439011",
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "todo fetched successfully.",
        todo,
      });
    });

    it("should pass an error to next when the todo ID is missing", async () => {
      const req = createRequest({
        params: {},
      });

      const res = createResponse();

      await invokeController(TodoController.getById, req, res);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Invalid Todo ID.",
          statusCode: 400,
        }),
      );

      expect(mockedTodoService.getById).not.toHaveBeenCalled();
    });

    it("should pass an error to next when the todo is not found", async () => {
      mockedTodoService.getById.mockRejectedValue(new Error("Todo not found."));

      const req = createRequest({
        params: { todoId: "507f1f77bcf86cd799439011" },
      });

      const res = createResponse();

      await invokeController(TodoController.getById, req, res);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Todo not found.",
        }),
      );

      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("should update a todo and return 200", async () => {
      const todo = {
        id: "507f1f77bcf86cd799439011",
        topicName: "Learn Docker",
        description: "Learn Docker basics",
        status: "Pending",
      };

      const payload = {
        topicName: "Learn Docker",
        description: "Learn Docker basics",
      };

      mockedTodoService.update.mockResolvedValue(todo as never);

      const req = createRequest({
        params: { todoId: "507f1f77bcf86cd799439011" },
        body: payload,
      });

      const res = createResponse();

      await invokeController(TodoController.update, req, res);

      expect(mockedTodoService.update).toHaveBeenCalledWith(
        "user-123",
        "507f1f77bcf86cd799439011",
        payload,
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "todo updated successfully.",
        todo,
      });
    });

    it("should pass an error to next when the todo ID is missing", async () => {
      const req = createRequest({
        params: {},
        body: { topicName: "Learn Docker" },
      });

      const res = createResponse();

      await invokeController(TodoController.update, req, res);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Invalid Todo ID.",
          statusCode: 400,
        }),
      );

      expect(mockedTodoService.update).not.toHaveBeenCalled();
    });

    it("should pass an error to next when updating a todo fails", async () => {
      mockedTodoService.update.mockRejectedValue(new Error("Todo not found."));

      const req = createRequest({
        params: { todoId: "507f1f77bcf86cd799439011" },
        body: { topicName: "Learn Docker" },
      });

      const res = createResponse();

      await invokeController(TodoController.update, req, res);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Todo not found.",
        }),
      );

      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("updateStatus", () => {
    it("should update a todo status and return 200", async () => {
      const todo = {
        id: "507f1f77bcf86cd799439011",
        topicName: "Learn Docker",
        description: "Learn Docker basics",
        status: "Completed",
      };

      mockedTodoService.updateStatus.mockResolvedValue(todo as never);

      const req = createRequest({
        params: { todoId: "507f1f77bcf86cd799439011" },
        body: { status: "Completed" },
      });

      const res = createResponse();

      await invokeController(TodoController.updateStatus, req, res);

      expect(mockedTodoService.updateStatus).toHaveBeenCalledWith(
        "user-123",
        "507f1f77bcf86cd799439011",
        "Completed",
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "todo status updated successfully.",
        todo,
      });
    });

    it("should pass an error to next when the todo ID is missing", async () => {
      const req = createRequest({
        params: {},
        body: { status: "Completed" },
      });

      const res = createResponse();

      await invokeController(TodoController.updateStatus, req, res);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Invalid Todo ID.",
          statusCode: 400,
        }),
      );

      expect(mockedTodoService.updateStatus).not.toHaveBeenCalled();
    });

    it("should pass an error to next when the status update fails", async () => {
      mockedTodoService.updateStatus.mockRejectedValue(
        new Error("Invalid Todo status."),
      );

      const req = createRequest({
        params: { todoId: "507f1f77bcf86cd799439011" },
        body: { status: "Invalid" },
      });

      const res = createResponse();

      await invokeController(TodoController.updateStatus, req, res);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Invalid Todo status.",
        }),
      );

      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("should delete a todo and return 200", async () => {
      mockedTodoService.delete.mockResolvedValue(undefined);

      const req = createRequest({
        params: { todoId: "507f1f77bcf86cd799439011" },
      });

      const res = createResponse();

      await invokeController(TodoController.delete, req, res);

      expect(mockedTodoService.delete).toHaveBeenCalledWith(
        "user-123",
        "507f1f77bcf86cd799439011",
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "todo deleted successfully.",
      });
    });

    it("should pass an error to next when the todo ID is missing", async () => {
      const req = createRequest({
        params: {},
      });

      const res = createResponse();

      await invokeController(TodoController.delete, req, res);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Invalid Todo ID.",
          statusCode: 400,
        }),
      );

      expect(mockedTodoService.delete).not.toHaveBeenCalled();
    });

    it("should pass an error to next when deleting a todo fails", async () => {
      mockedTodoService.delete.mockRejectedValue(new Error("Todo not found."));

      const req = createRequest({
        params: { todoId: "507f1f77bcf86cd799439011" },
      });

      const res = createResponse();

      await invokeController(TodoController.delete, req, res);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Todo not found.",
        }),
      );

      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("getStats", () => {
    it("should fetch todo statistics and return 200", async () => {
      const stats = {
        total: 5,
        pending: 2,
        processing: 1,
        completed: 2,
      };

      mockedTodoService.getStats.mockResolvedValue(stats);

      const req = createRequest();
      const res = createResponse();

      await invokeController(TodoController.getStats, req, res);

      expect(mockedTodoService.getStats).toHaveBeenCalledWith("user-123");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "todo statistics fetched successfully.",
        stats,
      });
    });

    it("should pass an error to next when fetching statistics fails", async () => {
      mockedTodoService.getStats.mockRejectedValue(
        new Error("Database error."),
      );

      const req = createRequest();
      const res = createResponse();

      await invokeController(TodoController.getStats, req, res);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Database error.",
        }),
      );

      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
