import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  fetchTodos,
  fetchTodoStats,
  createTodo,
  updateTodo,
  updateTodoStatus,
  deleteTodo,
  type Todo,
  type TodoStats,
} from "../api/todoApi";

type TodoState = {
  todos: Todo[];
  stats: TodoStats;
  loading: boolean;
  statsLoading: boolean;
  mutationLoading: boolean;
  error: string | null;
  statsError: string | null;
  search: string;
};

const initialStats: TodoStats = {
  total: 0,
  pending: 0,
  processing: 0,
  completed: 0,
};

const initialState: TodoState = {
  todos: [],
  stats: { ...initialStats },
  loading: false,
  statsLoading: false,
  mutationLoading: false,
  error: null,
  statsError: null,
  search: "",
};

const upsertTodo = (todos: Todo[], updatedTodo: Todo): Todo[] => {
  const index = todos.findIndex((todo) => todo.id === updatedTodo.id);

  if (index === -1) {
    return [updatedTodo, ...todos];
  }

  return todos.map((todo) => (todo.id === updatedTodo.id ? updatedTodo : todo));
};

export const TodoSlice = createSlice({
  name: "todos",
  initialState,

  reducers: {
    clearTodoError: (state) => {
      state.error = null;
    },

    clearStatsError: (state) => {
      state.statsError = null;
    },

    setTodoSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
    },

    resetTodos: () => ({
      ...initialState,
      todos: [],
      stats: { ...initialStats },
      search: "",
    }),
  },

  extraReducers: (builder) => {
    builder
      // Fetch all todos
      .addCase(fetchTodos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTodos.fulfilled, (state, action) => {
        state.loading = false;
        state.todos = action.payload;
      })
      .addCase(fetchTodos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Unable to load your todos.";
      })

      // Fetch statistics
      .addCase(fetchTodoStats.pending, (state) => {
        state.statsLoading = true;
        state.statsError = null;
      })
      .addCase(fetchTodoStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchTodoStats.rejected, (state, action) => {
        state.statsLoading = false;
        state.statsError = action.payload ?? "Unable to load todo statistics.";
      })

      // Create a todo
      .addCase(createTodo.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(createTodo.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.todos = upsertTodo(state.todos, action.payload);
      })
      .addCase(createTodo.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload ?? "Unable to create todo.";
      })

      // Update todo details
      .addCase(updateTodo.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(updateTodo.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.todos = upsertTodo(state.todos, action.payload);
      })
      .addCase(updateTodo.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload ?? "Unable to update todo.";
      })

      // Update todo status
      .addCase(updateTodoStatus.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(updateTodoStatus.fulfilled, (state, action) => {
        state.mutationLoading = false;

        const previousTodo = state.todos.find(
          (todo) => todo.id === action.payload.id,
        );

        if (previousTodo && previousTodo.status !== action.payload.status) {
          if (previousTodo.status === "Pending") {
            state.stats.pending = Math.max(0, state.stats.pending - 1);
          } else if (previousTodo.status === "Processing") {
            state.stats.processing = Math.max(0, state.stats.processing - 1);
          } else {
            state.stats.completed = Math.max(0, state.stats.completed - 1);
          }

          if (action.payload.status === "Pending") {
            state.stats.pending += 1;
          } else if (action.payload.status === "Processing") {
            state.stats.processing += 1;
          } else {
            state.stats.completed += 1;
          }
        }

        state.todos = upsertTodo(state.todos, action.payload);
      })
      .addCase(updateTodoStatus.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload ?? "Unable to update todo status.";
      })

      // Soft-delete a todo
      .addCase(deleteTodo.pending, (state) => {
        state.mutationLoading = true;
        state.error = null;
      })
      .addCase(deleteTodo.fulfilled, (state, action) => {
        const deletedTodo = state.todos.find(
          (todo) => todo.id === action.payload,
        );

        state.mutationLoading = false;
        state.todos = state.todos.filter((todo) => todo.id !== action.payload);

        if (deletedTodo) {
          state.stats.total = Math.max(0, state.stats.total - 1);

          if (deletedTodo.status === "Pending") {
            state.stats.pending = Math.max(0, state.stats.pending - 1);
          } else if (deletedTodo.status === "Processing") {
            state.stats.processing = Math.max(0, state.stats.processing - 1);
          } else {
            state.stats.completed = Math.max(0, state.stats.completed - 1);
          }
        }
      })
      .addCase(deleteTodo.rejected, (state, action) => {
        state.mutationLoading = false;
        state.error = action.payload ?? "Unable to delete todo.";
      });
  },
});

export const { clearTodoError, clearStatsError, setTodoSearch, resetTodos } =
  TodoSlice.actions;

export default TodoSlice.reducer;
