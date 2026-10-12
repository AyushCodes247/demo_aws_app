import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { AlertCircle, FileText, Plus, RotateCcw } from "lucide-react";

import type { CreateTodoInput } from "../../api/todoApi";
import { createTodo, fetchTodos, fetchTodoStats } from "../../api/todoApi";
import { clearTodoError } from "../../slices/todoslice";
import { useAppDispatch, useAppSelector } from "../../hooks/appHook";

const Creation = () => {
  const dispatch = useAppDispatch();

  const { mutationLoading, error } = useAppSelector((state) => state.todos);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTodoInput>({
    defaultValues: {
      topicName: "",
      description: "",
    },
    mode: "onBlur",
  });

  useEffect(() => {
    dispatch(clearTodoError());
  }, [dispatch]);

  const onSubmit = async (values: CreateTodoInput) => {
    dispatch(clearTodoError());

    try {
      await dispatch(
        createTodo({
          topicName: values.topicName.trim(),
          description: values.description?.trim() ?? "",
        }),
      ).unwrap();

      reset();

      // Fetch authoritative data from the backend after creation.
      await Promise.all([dispatch(fetchTodos()), dispatch(fetchTodoStats())]);
    } catch {
      // The rejected thunk stores its message in the Redux error state.
      // The error is displayed below the form.
    }
  };

  const isLoading = mutationLoading || isSubmitting;

  return (
    <section
      aria-labelledby="creation-heading"
      className="rounded-2xl border border-white/[0.08] bg-[#111113] p-5 text-zinc-100 shadow-lg sm:p-6"
    >
      <header className="mb-6 flex items-start gap-3">
        <div className="rounded-xl bg-violet-500/10 p-3 text-violet-400">
          <FileText size={21} aria-hidden="true" />
        </div>

        <div>
          <h2
            id="creation-heading"
            className="text-base font-semibold text-white"
          >
            Create a new task
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Add a task to your workspace and keep moving forward.
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div>
          <label
            htmlFor="topicName"
            className="mb-2 block text-sm font-medium text-zinc-300"
          >
            Task title <span className="text-violet-400">*</span>
          </label>

          <input
            id="topicName"
            type="text"
            placeholder="e.g. Complete frontend dashboard"
            autoComplete="off"
            aria-invalid={Boolean(errors.topicName)}
            aria-describedby={errors.topicName ? "topicName-error" : undefined}
            {...register("topicName", {
              required: "Please enter a task title.",
              minLength: {
                value: 3,
                message: "The title must contain at least 3 characters.",
              },
              maxLength: {
                value: 100,
                message: "The title cannot exceed 100 characters.",
              },
              validate: (value) =>
                value.trim().length >= 3 ||
                "The title must contain at least 3 non-space characters.",
            })}
            onChange={() => {
              if (error) dispatch(clearTodoError());
            }}
            className={`w-full rounded-xl border bg-[#09090b] px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:ring-2 focus:ring-violet-500/30 ${
              errors.topicName
                ? "border-red-500/60 focus:border-red-500"
                : "border-white/[0.08] focus:border-violet-500/60"
            }`}
          />

          {errors.topicName && (
            <p
              id="topicName-error"
              role="alert"
              className="mt-2 flex items-center gap-1.5 text-xs text-red-400"
            >
              <AlertCircle size={14} aria-hidden="true" />
              {errors.topicName.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-medium text-zinc-300"
          >
            Description{" "}
            <span className="font-normal text-zinc-500">(optional)</span>
          </label>

          <textarea
            id="description"
            rows={4}
            placeholder="What needs to be done? Add any useful details..."
            aria-invalid={Boolean(errors.description)}
            aria-describedby={
              errors.description ? "description-error" : undefined
            }
            {...register("description", {
              maxLength: {
                value: 2000,
                message: "The description cannot exceed 2000 characters.",
              },
            })}
            onChange={() => {
              if (error) dispatch(clearTodoError());
            }}
            className={`w-full resize-y rounded-xl border bg-[#09090b] px-4 py-3 text-sm leading-6 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:ring-2 focus:ring-violet-500/30 ${
              errors.description
                ? "border-red-500/60 focus:border-red-500"
                : "border-white/[0.08] focus:border-violet-500/60"
            }`}
          />

          {errors.description && (
            <p
              id="description-error"
              role="alert"
              className="mt-2 text-xs text-red-400"
            >
              {errors.description.message}
            </p>
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.06] p-3 text-sm text-red-400"
          >
            <AlertCircle
              size={17}
              className="mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <p>{error}</p>
          </div>
        )}

        <footer className="flex flex-col-reverse gap-3 border-t border-white/[0.08] pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => {
              reset();
              dispatch(clearTodoError());
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] px-4 py-3 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw size={16} aria-hidden="true" />
            Clear form
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-950/20 transition hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-[#111113] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <span
                  className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                  aria-hidden="true"
                />
                Creating task...
              </>
            ) : (
              <>
                <Plus size={17} aria-hidden="true" />
                Create task
              </>
            )}
          </button>
        </footer>
      </form>
    </section>
  );
};

export default Creation;
