import { useEffect } from "react";
import {
  Activity,
  CheckCircle2,
  Clock3,
  ListTodo,
  RefreshCw,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { useAppDispatch, useAppSelector } from "../../hooks/appHook";
import { fetchTodoStats } from "../../api/todoApi";
import { clearStatsError } from "../../slices/todoslice";

const chartColors = {
  pending: "#a1a1aa",
  processing: "#8b5cf6",
  completed: "#34d399",
};

const Chart = () => {
  const dispatch = useAppDispatch();

  const { stats, statsLoading, statsError } = useAppSelector(
    (state) => state.todos,
  );

  useEffect(() => {
    void dispatch(fetchTodoStats());
  }, [dispatch]);

  const chartData = [
    {
      name: "Pending",
      value: stats.pending,
      color: chartColors.pending,
    },
    {
      name: "In progress",
      value: stats.processing,
      color: chartColors.processing,
    },
    {
      name: "Completed",
      value: stats.completed,
      color: chartColors.completed,
    },
  ];

  const completionRate =
    stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const handleRefresh = () => {
    dispatch(clearStatsError());
    void dispatch(fetchTodoStats());
  };

  return (
    <section
      aria-labelledby="chart-heading"
      className="min-w-0 rounded-2xl border border-white/[0.08] bg-[#111113] p-5 text-zinc-100 shadow-lg sm:p-6"
    >
      {/* Header */}
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="chart-heading" className="text-base font-semibold text-white">
            Task overview
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Your current task distribution
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={statsLoading}
          aria-label="Refresh task statistics"
          title="Refresh statistics"
          className="shrink-0 rounded-lg border border-white/[0.08] p-2.5 text-zinc-400 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={statsLoading ? "animate-spin" : ""}
            aria-hidden="true"
          />
        </button>
      </header>

      {/* Error state */}
      {statsError && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-500/20 bg-red-500/[0.06] p-3"
        >
          <p className="break-words text-sm text-red-400">{statsError}</p>

          <button
            type="button"
            onClick={handleRefresh}
            className="mt-2 text-xs font-medium text-red-300 underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      )}

      {/* Keep the donut on its own row to prevent sidebar clipping. */}
      <div className="mt-5">
        {statsLoading && stats.total === 0 ? (
          <div
            className="flex h-56 items-center justify-center"
            role="status"
            aria-label="Loading task statistics"
          >
            <div className="size-8 animate-spin rounded-full border-2 border-violet-500/20 border-t-violet-500" />
          </div>
        ) : stats.total === 0 ? (
          <div className="flex h-56 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/[0.08]">
            <ListTodo size={30} className="text-zinc-600" />
            <p className="text-sm text-zinc-500">No tasks to display</p>
          </div>
        ) : (
          <div className="relative mx-auto h-56 w-full max-w-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="67%"
                  outerRadius="88%"
                  paddingAngle={stats.total > 1 ? 3 : 0}
                  stroke="none"
                  cornerRadius={4}
                  isAnimationActive={!statsLoading}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>

                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color: "#f4f4f5",
                    fontSize: "12px",
                  }}
                  formatter={(value, name) => [value, name]}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold tracking-tight text-white">
                {stats.total}
              </span>
              <span className="mt-1 text-xs text-zinc-500">Total tasks</span>
            </div>
          </div>
        )}
      </div>

      {/* Completion rate */}
      <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
        <div className="flex items-center gap-2 text-zinc-400">
          <Activity size={16} className="shrink-0 text-violet-400" />
          <span className="text-xs">Completion rate</span>
        </div>

        <div className="mt-2 flex items-end justify-between gap-3">
          <span className="text-2xl font-semibold text-white">
            {completionRate}%
          </span>
          <span className="text-xs text-zinc-500">
            {stats.completed} of {stats.total}
          </span>
        </div>

        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.08]"
          role="progressbar"
          aria-label="Task completion rate"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={completionRate}
        >
          <div
            className="h-full rounded-full bg-emerald-400 transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* Status breakdown */}
      <ul className="mt-5 space-y-4">
        <li className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="size-2.5 shrink-0 rounded-full bg-zinc-400" />
            <span className="text-sm text-zinc-400">Pending</span>
          </div>
          <span className="text-sm font-semibold tabular-nums text-white">
            {stats.pending}
          </span>
        </li>

        <li className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="size-2.5 shrink-0 rounded-full bg-violet-500" />
            <span className="text-sm text-zinc-400">In progress</span>
          </div>
          <span className="text-sm font-semibold tabular-nums text-white">
            {stats.processing}
          </span>
        </li>

        <li className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="size-2.5 shrink-0 rounded-full bg-emerald-400" />
            <span className="text-sm text-zinc-400">Completed</span>
          </div>
          <span className="text-sm font-semibold tabular-nums text-white">
            {stats.completed}
          </span>
        </li>
      </ul>

      {/* Footer */}
      <footer className="mt-5 flex items-start gap-2 border-t border-white/[0.08] pt-4 text-xs leading-5 text-zinc-500">
        <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-400" />
        <span>
          <Clock3 size={12} className="mr-1 inline" />
          Statistics synced with your task data
        </span>
      </footer>
    </section>
  );
};

export default Chart;
