import { useEffect } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Clock3,
  ListTodo,
  LoaderCircle,
  Trash2,
} from "lucide-react";

import Creation from "./Creation";
import Search from "./Search";
import Chart from "./Chart";
import Profile from "../Users/Profile/Profile";
import Logout from "../Users/Logout/Logout";

import {
  deleteTodo,
  fetchTodos,
  updateTodoStatus,
  fetchTodoStats,
  type TodoStatus,
} from "../../api/todoApi";

import { clearTodoError } from "../../slices/todoslice";

import { useAppDispatch, useAppSelector } from "../../hooks/appHook";

const statusOptions: TodoStatus[] = ["Pending", "Processing", "Completed"];

const statusStyles: Record<TodoStatus, string> = {
  Pending: "border-zinc-500/20 bg-zinc-500/10 text-zinc-300",
  Processing: "border-violet-500/20 bg-violet-500/10 text-violet-300",
  Completed: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
};

const Dashboard = () => {
  const dispatch = useAppDispatch();

  const { todos, search, loading, mutationLoading, error } = useAppSelector(
    (state) => state.todos,
  );

  const user = useAppSelector((state) => state.user.user);

  useEffect(() => {
    void dispatch(fetchTodos());
  }, [dispatch]);

  const query = search.trim().toLowerCase();

  const filteredTodos = todos.filter((todo) => {
    return (
      todo.topicName.toLowerCase().includes(query) ||
      (todo.description ?? "").toLowerCase().includes(query)
    );
  });

  const handleStatusChange = async (todoId: string, status: TodoStatus) => {
    try {
      await dispatch(updateTodoStatus({ todoId, status })).unwrap();

      await dispatch(fetchTodoStats());
    } catch {
      // The rejected thunk stores the error in Redux.
    }
  };

  const handleDelete = async (todoId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?",
    );

    if (!confirmed) return;

    try {
      await dispatch(deleteTodo(todoId)).unwrap();
      await dispatch(fetchTodoStats());
    } catch {
      // The rejected thunk stores the error in Redux.
    }
  };

  const formatDate = (date?: string | null) => {
    if (!date) return null;

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return null;

    return parsedDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100">
      <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        {/* Dashboard header */}
        <header className="mb-8 flex flex-col gap-5 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">
              Tasklane workspace
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Welcome back{user.username ? `, ${user.username}` : ""}
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Organize your work, track progress, and get things done.
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-zinc-400">
              <span className="mr-2 inline-block size-2 rounded-full bg-emerald-400" />
              Workspace active
            </span>

            <Logout />
          </div>
        </header>

        {/* Main dashboard grid */}
        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-6">
            {/* Create task */}
            <Creation />

            {/* Search and task list */}
            <section
              aria-labelledby="tasks-heading"
              className="rounded-2xl border border-white/[0.08] bg-[#111113] p-5 shadow-lg sm:p-6"
            >
              <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2
                    id="tasks-heading"
                    className="text-base font-semibold text-white"
                  >
                    Your tasks
                  </h2>

                  <p className="mt-1 text-sm text-zinc-500">
                    {filteredTodos.length}{" "}
                    {filteredTodos.length === 1 ? "task" : "tasks"}
                    {query ? " found" : " in your workspace"}
                  </p>
                </div>

                <div className="w-full sm:max-w-xs">
                  <Search />
                </div>
              </header>

              {error && !loading && (
                <div
                  role="alert"
                  className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.06] p-3 text-sm text-red-400"
                >
                  <AlertCircle
                    size={17}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                  />

                  <div className="min-w-0 flex-1">
                    <p>{error}</p>

                    <button
                      type="button"
                      onClick={() => {
                        dispatch(clearTodoError());
                        void dispatch(fetchTodos());
                      }}
                      className="mt-2 text-xs font-medium underline underline-offset-4"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              )}

              {loading && todos.length === 0 ? (
                <div
                  role="status"
                  className="flex min-h-48 flex-col items-center justify-center gap-3 text-zinc-500"
                >
                  <LoaderCircle
                    size={28}
                    className="animate-spin text-violet-400"
                  />
                  <p className="text-sm">Loading your tasks...</p>
                </div>
              ) : filteredTodos.length === 0 ? (
                <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] px-4 text-center">
                  <div className="rounded-2xl bg-white/[0.04] p-3">
                    <ListTodo
                      size={25}
                      className="text-zinc-500"
                      aria-hidden="true"
                    />
                  </div>

                  <h3 className="mt-4 text-sm font-semibold text-zinc-200">
                    {query ? "No matching tasks" : "Nothing here yet"}
                  </h3>

                  <p className="mt-2 max-w-sm text-sm text-zinc-500">
                    {query
                      ? "Try another keyword or clear your search."
                      : "Create your first task above to start organizing your work."}
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {filteredTodos.map((todo) => (
                    <li
                      key={todo.id}
                      className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition hover:border-white/[0.12] hover:bg-white/[0.03] sm:p-5"
                    >
                      <article className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 gap-3">
                          <div className="mt-0.5 shrink-0">
                            {todo.status === "Completed" ? (
                              <CheckCircle2
                                size={20}
                                className="text-emerald-400"
                                aria-label="Completed"
                              />
                            ) : todo.status === "Processing" ? (
                              <Clock3
                                size={20}
                                className="text-violet-400"
                                aria-label="In progress"
                              />
                            ) : (
                              <Circle
                                size={20}
                                className="text-zinc-500"
                                aria-label="Pending"
                              />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3
                              className={`break-words text-sm font-semibold ${
                                todo.status === "Completed"
                                  ? "text-zinc-400 line-through"
                                  : "text-zinc-100"
                              }`}
                            >
                              {todo.topicName}
                            </h3>

                            {todo.description && (
                              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-500">
                                {todo.description}
                              </p>
                            )}

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles[todo.status]}`}
                              >
                                {todo.status === "Processing"
                                  ? "In progress"
                                  : todo.status}
                              </span>

                              {formatDate(todo.createdAt) && (
                                <span className="text-xs text-zinc-600">
                                  Created {formatDate(todo.createdAt)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2 sm:justify-end">
                          <label
                            htmlFor={`status-${todo.id}`}
                            className="sr-only"
                          >
                            Update status for {todo.topicName}
                          </label>

                          <select
                            id={`status-${todo.id}`}
                            value={todo.status}
                            disabled={mutationLoading}
                            onChange={(event) =>
                              void handleStatusChange(
                                todo.id,
                                event.target.value as TodoStatus,
                              )
                            }
                            className="min-w-0 flex-1 rounded-lg border border-white/[0.08] bg-[#09090b] px-2.5 py-2 text-xs text-zinc-300 outline-none transition focus:border-violet-500/60 disabled:opacity-50 sm:flex-none"
                          >
                            {statusOptions.map((status) => (
                              <option key={status} value={status}>
                                {status === "Processing"
                                  ? "In progress"
                                  : status}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            disabled={mutationLoading}
                            onClick={() => void handleDelete(todo.id)}
                            aria-label={`Delete ${todo.topicName}`}
                            title="Delete task"
                            className="rounded-lg border border-white/[0.08] p-2 text-zinc-500 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 size={16} aria-hidden="true" />
                          </button>
                        </div>
                      </article>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Dashboard sidebar */}
          <aside className="min-w-0 space-y-6">
            <Profile />
            <Chart />
          </aside>
        </div>

        <footer className="mt-8 border-t border-white/[0.08] pt-5 text-center text-xs text-zinc-600">
          Tasklane · Stay focused. Make progress.
        </footer>
      </div>
    </main>
  );
};

export default Dashboard;
