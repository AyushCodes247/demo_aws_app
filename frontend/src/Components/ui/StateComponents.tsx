import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  RefreshCw,
  X,
} from "lucide-react";

type LoadingStateProps = {
  label?: string;
};

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
};

type SuccessToastProps = {
  visible: boolean;
  message: string;
  onClose?: () => void;
};

type TaskListSkeletonProps = {
  count?: number;
};

type SavingIndicatorProps = {
  label?: string;
};

const surfaceClass = "rounded-xl border border-[#26262A] bg-[#0C0C0D]";

const transition = {
  duration: 0.22,
  ease: "easeOut" as const,
};

export function LoadingState({ label = "Loading..." }: LoadingStateProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section
      aria-label={label}
      aria-busy="true"
      className="flex min-h-40 flex-col items-center justify-center gap-3 text-center"
    >
      <motion.div
        animate={reduceMotion ? undefined : { rotate: 360 }}
        transition={
          reduceMotion
            ? undefined
            : {
                duration: 1,
                repeat: Infinity,
                ease: "linear",
              }
        }
        className="flex items-center justify-center"
      >
        <LoaderCircle aria-hidden="true" size={25} className="text-[#8175F5]" />
      </motion.div>

      <p className="font-inter text-sm text-[#9C9CA6]">{label}</p>
    </section>
  );
}

export function TaskListSkeleton({ count = 4 }: TaskListSkeletonProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section aria-label="Loading tasks" aria-busy="true" className="space-y-3">
      {Array.from({ length: count }, (_, index) => (
        <motion.article
          key={index}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            ...transition,
            delay: reduceMotion ? 0 : index * 0.06,
          }}
          className={`${surfaceClass} flex items-center gap-4 p-4 sm:p-5`}
        >
          <motion.div
            aria-hidden="true"
            animate={reduceMotion ? undefined : { opacity: [0.45, 0.8, 0.45] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="size-5 shrink-0 rounded-md bg-[#26262A]"
          />

          <div className="min-w-0 flex-1 space-y-2.5">
            <div className="h-3.5 w-2/3 max-w-56 rounded bg-[#26262A]" />
            <div className="h-3 w-1/2 max-w-40 rounded bg-[#181819]" />
          </div>

          <div
            aria-hidden="true"
            className="hidden h-6 w-20 rounded-full bg-[#181819] sm:block"
          />
        </motion.article>
      ))}
    </section>
  );
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try again",
}: ErrorStateProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      role="alert"
      initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={transition}
      className={`${surfaceClass} flex flex-col items-center px-5 py-8 text-center sm:px-8 sm:py-10`}
    >
      <div className="mb-4 flex size-12 items-center justify-center rounded-full border border-[#E5766F]/20 bg-[#E5766F]/10">
        <AlertCircle aria-hidden="true" size={23} className="text-[#E5766F]" />
      </div>

      <h2 className="font-jakarta text-lg font-semibold text-[#F4F5F9]">
        {title}
      </h2>

      <p className="mt-2 max-w-md font-inter text-sm leading-6 text-[#9C9CA6]">
        {message}
      </p>

      {onRetry && (
        <motion.button
          type="button"
          onClick={onRetry}
          whileHover={reduceMotion ? undefined : { scale: 1.02 }}
          whileTap={reduceMotion ? undefined : { scale: 0.98 }}
          className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#8175F5]/40 bg-[#8175F5]/10 px-4 py-2 font-inter text-sm font-medium text-[#B8B0FF] transition-colors hover:bg-[#8175F5]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8175F5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0C0C0D]"
        >
          <RefreshCw aria-hidden="true" size={15} />
          {retryLabel}
        </motion.button>
      )}
    </motion.section>
  );
}

export function SuccessToast({ visible, message, onClose }: SuccessToastProps) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="success-toast"
          role="status"
          aria-live="polite"
          initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: 8, scale: 0.98 }}
          transition={transition}
          className="fixed bottom-5 right-4 z-50 flex w-[calc(100%-2rem)] max-w-sm items-start gap-3 rounded-xl border border-[#4FBF92]/25 bg-[#111112] p-4 shadow-2xl shadow-black/30 sm:bottom-6 sm:right-6"
        >
          <CheckCircle2
            aria-hidden="true"
            size={20}
            className="mt-0.5 shrink-0 text-[#4FBF92]"
          />

          <p className="min-w-0 flex-1 font-inter text-sm leading-5 text-[#F4F5F9]">
            {message}
          </p>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Dismiss notification"
              className="shrink-0 rounded-md p-1 text-[#9C9CA6] transition-colors hover:bg-[#26262A] hover:text-[#F4F5F9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8175F5]"
            >
              <X aria-hidden="true" size={16} />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function SavingIndicator({ label = "Saving..." }: SavingIndicatorProps) {
  const reduceMotion = useReducedMotion();

  return (
    <span
      role="status"
      className="inline-flex items-center gap-2 font-inter text-xs text-[#9C9CA6]"
    >
      <motion.span
        animate={reduceMotion ? undefined : { rotate: 360 }}
        transition={
          reduceMotion
            ? undefined
            : {
                duration: 1,
                repeat: Infinity,
                ease: "linear",
              }
        }
        className="inline-flex"
      >
        <LoaderCircle aria-hidden="true" size={14} className="text-[#8175F5]" />
      </motion.span>

      {label}
    </span>
  );
}
