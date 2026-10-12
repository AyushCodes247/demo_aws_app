import { CalendarDays, Mail, UserRound } from "lucide-react";
import { useAppSelector } from "../../../hooks/appHook";

const Profile = () => {
  const user = useAppSelector((state) => state.user.user);

  const initials =
    user.username
      ?.trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  const formattedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Recently joined";

  return (
    <section
      aria-labelledby="profile-heading"
      className="rounded-2xl border border-white/[0.08] bg-[#111113] p-5 text-zinc-100 shadow-lg sm:p-6"
    >
      <header className="mb-5 flex items-center justify-between">
        <h2
          id="profile-heading"
          className="text-sm font-semibold tracking-wide text-zinc-100"
        >
          Your Profile
        </h2>

        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
          Account
        </span>
      </header>

      <div className="flex items-center gap-4">
        <div
          aria-label={`${user.username || "User"} avatar`}
          className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-xl font-bold text-white shadow-lg shadow-violet-950/30"
        >
          {initials}
        </div>

        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold text-white">
            {user.username || "Your account"}
          </h3>

          <p className="mt-1 truncate text-sm text-zinc-400">Tasklane member</p>
        </div>
      </div>

      <div className="my-5 border-t border-white/[0.08]" />

      <dl className="space-y-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="rounded-lg bg-white/[0.05] p-2 text-zinc-400">
            <Mail size={17} aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1">
            <dt className="text-xs text-zinc-500">Email address</dt>
            <dd className="mt-1 break-all text-sm text-zinc-200">
              {user.email || "No email available"}
            </dd>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-white/[0.05] p-2 text-zinc-400">
            <CalendarDays size={17} aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1">
            <dt className="text-xs text-zinc-500">Member since</dt>
            <dd className="mt-1 text-sm text-zinc-200">{formattedDate}</dd>
          </div>
        </div>

        {user.publicId && (
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-white/[0.05] p-2 text-zinc-400">
              <UserRound size={17} aria-hidden="true" />
            </div>

            <div className="min-w-0 flex-1">
              <dt className="text-xs text-zinc-500">User ID</dt>
              <dd className="mt-1 break-all font-mono text-xs text-zinc-300">
                {user.publicId}
              </dd>
            </div>
          </div>
        )}
      </dl>
    </section>
  );
};

export default Profile;
