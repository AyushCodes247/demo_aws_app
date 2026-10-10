import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { Eye, EyeOff } from "lucide-react";

type LoginFormData = {
  email: string;
  password: string;
};

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    console.log(data);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#09090b] px-4 py-10 font-inter text-[#fafafa] selection:bg-violet-500/30 sm:px-6">
      <section className="w-full max-w-105">
        <section className="rounded-2xl border border-white/8 bg-[#111113] p-5 shadow-2xl shadow-black/20 sm:p-8">
          <header className="mb-8">
            <Link
              to="/"
              className="mb-8 inline-flex items-center gap-3 font-jakarta text-[23px] font-bold tracking-tight text-white"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-violet-600 shadow-lg shadow-violet-600/20">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="size-6"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M5 6h14M5 18h8" />
                </svg>
              </span>
              Tasklane
            </Link>

            <h1 className="font-jakarta text-3xl font-bold tracking-tight sm:text-[32px]">
              Welcome back
            </h1>

            <p className="mt-2 text-sm leading-6 text-zinc-400 sm:text-[15px]">
              Sign in to pick up where you left off.
            </p>
          </header>

          <form
            id="fLogin"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="space-y-5"
          >
            <fieldset className="min-w-0 space-y-5">
              <legend className="sr-only">Sign in to Tasklane</legend>

              <div className="space-y-2">
                <label
                  htmlFor="le"
                  className="block text-sm font-medium text-zinc-200"
                >
                  Email
                </label>

                <input
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Enter a valid email address",
                    },
                  })}
                  className={`h-12 w-full rounded-xl border bg-[#09090b] px-4 text-sm text-white outline-none transition placeholder:text-zinc-600 hover:border-white/20 focus:ring-4 focus:ring-violet-500/10 ${
                    errors.email
                      ? "border-red-500 focus:border-red-500"
                      : "border-white/10 focus:border-violet-500"
                  }`}
                  id="le"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "le-error" : undefined}
                />

                {errors.email && (
                  <p
                    id="le-error"
                    className="text-xs text-red-400"
                    role="alert"
                  >
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="lp"
                  className="block text-sm font-medium text-zinc-200"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    {...register("password", {
                      required: "Password is required",
                    })}
                    className={`h-12 w-full rounded-xl border bg-[#09090b] px-4 pr-12 text-sm text-white outline-none transition placeholder:text-zinc-600 hover:border-white/20 focus:ring-4 focus:ring-violet-500/10 ${
                      errors.password
                        ? "border-red-500 focus:border-red-500"
                        : "border-white/10 focus:border-violet-500"
                    }`}
                    id="lp"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Your password"
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? "lp-error" : undefined}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute inset-y-0 right-3 flex items-center justify-center text-zinc-400 transition hover:text-white focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-controls="lp"
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <EyeOff size={18} aria-hidden="true" />
                    ) : (
                      <Eye size={18} aria-hidden="true" />
                    )}
                  </button>
                </div>

                {errors.password && (
                  <p
                    id="lp-error"
                    className="text-xs text-red-400"
                    role="alert"
                  >
                    {errors.password.message}
                  </p>
                )}
              </div>
            </fieldset>

            <button
              className="flex h-12 w-full items-center justify-center rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white shadow-lg shadow-violet-600/15 transition hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <footer className="mt-6 text-center text-sm text-zinc-500">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-violet-400 transition hover:text-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              Create an account
            </Link>
          </footer>
        </section>
      </section>
    </main>
  );
};

export default Login;
