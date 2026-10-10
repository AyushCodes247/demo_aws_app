import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { Eye, EyeOff } from "lucide-react";

type RegisterFormData = {
  username: string;
  email: string;
  password: string;
};

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    mode: "onBlur",
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
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
              Create your account
            </h1>

            <p className="mt-2 text-sm leading-6 text-zinc-400 sm:text-[15px]">
              Start tracking your tasks in under a minute.
            </p>
          </header>

          <form
            id="fRegister"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="space-y-5"
          >
            <fieldset className="min-w-0 space-y-5">
              <legend className="sr-only">Create your Tasklane account</legend>

              <div className="space-y-2">
                <label
                  htmlFor="rUsername"
                  className="block text-sm font-medium text-zinc-200"
                >
                  Username
                </label>

                <input
                  {...register("username", {
                    required: "Username is required",
                    minLength: {
                      value: 3,
                      message: "Username must contain at least 3 characters",
                    },
                    maxLength: {
                      value: 30,
                      message: "Username cannot exceed 30 characters",
                    },
                  })}
                  className={`h-12 w-full rounded-xl border bg-[#09090b] px-4 text-sm text-white outline-none transition placeholder:text-zinc-600 hover:border-white/20 focus:ring-4 focus:ring-violet-500/10 ${
                    errors.username
                      ? "border-red-500 focus:border-red-500"
                      : "border-white/10 focus:border-violet-500"
                  }`}
                  id="rUsername"
                  type="text"
                  autoComplete="username"
                  placeholder="Choose a username"
                  aria-invalid={Boolean(errors.username)}
                  aria-describedby={
                    errors.username ? "rUsernameError" : undefined
                  }
                />

                {errors.username && (
                  <p
                    id="rUsernameError"
                    className="text-xs text-red-400"
                    role="alert"
                  >
                    {errors.username.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="rEmail"
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
                  id="rEmail"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "rEmailError" : undefined}
                />

                {errors.email && (
                  <p
                    id="rEmailError"
                    className="text-xs text-red-400"
                    role="alert"
                  >
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="rPassword"
                  className="block text-sm font-medium text-zinc-200"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 8,
                        message: "Password must contain at least 8 characters",
                      },
                    })}
                    className={`h-12 w-full rounded-xl border bg-[#09090b] px-4 pr-12 text-sm text-white outline-none transition placeholder:text-zinc-600 hover:border-white/20 focus:ring-4 focus:ring-violet-500/10 ${
                      errors.password
                        ? "border-red-500 focus:border-red-500"
                        : "border-white/10 focus:border-violet-500"
                    }`}
                    id="rPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Create a password"
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={
                      errors.password ? "rPasswordError" : undefined
                    }
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute inset-y-0 right-3 flex items-center justify-center text-zinc-400 transition hover:text-white focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-controls="rPassword"
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
                    id="rPasswordError"
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
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>
          </form>

          <footer className="mt-6 text-center text-sm text-zinc-500">
            Already registered?{" "}
            <Link
              to="/"
              className="font-semibold text-violet-400 transition hover:text-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              Sign in
            </Link>
          </footer>
        </section>
      </section>
    </main>
  );
};

export default Register;
