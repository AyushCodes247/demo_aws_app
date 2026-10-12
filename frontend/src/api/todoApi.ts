import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import api from "./api";

export type TodoStatus = "Pending" | "Processing" | "Completed";

export interface Todo {
  id: string;
  topicName: string;
  description: string;
  status: TodoStatus;
  dueAt: string | null;
  reminderAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TodoStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
}

export interface CreateTodoInput {
  topicName: string;
  description?: string;
}

export interface UpdateTodoInput {
  todoId: string;
  topicName?: string;
  description?: string;
  dueAt?: string | null;
  reminderAt?: string | null;
}

export interface UpdateTodoStatusInput {
  todoId: string;
  status: TodoStatus;
}

interface TodoResponse {
  success: boolean;
  message: string;
  todo: Todo;
}

interface TodosResponse {
  success: boolean;
  message: string;
  todos: Todo[];
}

interface TodoStatsResponse {
  success: boolean;
  message: string;
  stats: TodoStats;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
}

type ThunkConfig = {
  rejectValue: string;
  state: {
    user: {
      accessToken: string;
    };
  };
};

const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    if (!error.response) {
      return "Unable to connect to the server. Please try again.";
    }

    return (
      error.response.data?.message ??
      error.response.data?.error ??
      "The request failed. Please try again."
    );
  }

  return "Something went wrong. Please try again.";
};

const getAuthHeaders = (accessToken: string) => ({
  Authorization: `Bearer ${accessToken}`,
});

export const fetchTodos = createAsyncThunk<Todo[], void, ThunkConfig>(
  "todos/fetchAll",
  async (_, { rejectWithValue, getState }) => {
    try {
      const { accessToken } = getState().user;

      if (!accessToken) {
        return rejectWithValue(
          "Your session has expired. Please log in again.",
        );
      }

      const { data } = await api.get<TodosResponse>("/todos", {
        headers: getAuthHeaders(accessToken),
      });

      return data.todos;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const fetchTodoStats = createAsyncThunk<TodoStats, void, ThunkConfig>(
  "todos/fetchStats",
  async (_, { rejectWithValue, getState }) => {
    try {
      const { accessToken } = getState().user;

      if (!accessToken) {
        return rejectWithValue(
          "Your session has expired. Please log in again.",
        );
      }

      const { data } = await api.get<TodoStatsResponse>("/todos/stats", {
        headers: getAuthHeaders(accessToken),
      });

      return data.stats;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const createTodo = createAsyncThunk<Todo, CreateTodoInput, ThunkConfig>(
  "todos/create",
  async (payload, { rejectWithValue, getState }) => {
    try {
      const { accessToken } = getState().user;

      if (!accessToken) {
        return rejectWithValue(
          "Your session has expired. Please log in again.",
        );
      }

      const { data } = await api.post<TodoResponse>("/todos", payload, {
        headers: getAuthHeaders(accessToken),
      });

      return data.todo;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const updateTodo = createAsyncThunk<Todo, UpdateTodoInput, ThunkConfig>(
  "todos/update",
  async ({ todoId, ...payload }, { rejectWithValue, getState }) => {
    try {
      const { accessToken } = getState().user;

      if (!accessToken) {
        return rejectWithValue(
          "Your session has expired. Please log in again.",
        );
      }

      const { data } = await api.patch<TodoResponse>(
        `/todos/${encodeURIComponent(todoId)}`,
        payload,
        {
          headers: getAuthHeaders(accessToken),
        },
      );

      return data.todo;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const updateTodoStatus = createAsyncThunk<
  Todo,
  UpdateTodoStatusInput,
  ThunkConfig
>(
  "todos/updateStatus",
  async ({ todoId, status }, { rejectWithValue, getState }) => {
    try {
      const { accessToken } = getState().user;

      if (!accessToken) {
        return rejectWithValue(
          "Your session has expired. Please log in again.",
        );
      }

      const { data } = await api.patch<TodoResponse>(
        `/todos/${encodeURIComponent(todoId)}/status`,
        { status },
        {
          headers: getAuthHeaders(accessToken),
        },
      );

      return data.todo;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const deleteTodo = createAsyncThunk<string, string, ThunkConfig>(
  "todos/delete",
  async (todoId, { rejectWithValue, getState }) => {
    try {
      const { accessToken } = getState().user;

      if (!accessToken) {
        return rejectWithValue(
          "Your session has expired. Please log in again.",
        );
      }

      await api.delete(`/todos/${encodeURIComponent(todoId)}/delete`, {
        headers: getAuthHeaders(accessToken),
      });

      return todoId;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);
