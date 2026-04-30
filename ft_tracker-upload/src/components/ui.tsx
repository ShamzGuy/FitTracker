import clsx from "clsx";
import Link, { type LinkProps } from "next/link";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 active:opacity-80",
  secondary:
    "bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)] hover:bg-black/[0.03] dark:hover:bg-white/[0.05]",
  ghost:
    "bg-transparent text-[var(--foreground)] hover:bg-black/[0.05] dark:hover:bg-white/[0.05]",
  danger:
    "bg-[var(--danger)] text-white hover:opacity-90 active:opacity-80",
};

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 h-11 text-sm font-medium transition select-none disabled:opacity-50 disabled:pointer-events-none",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  variant = "primary",
  className,
  children,
  ...props
}: LinkProps & {
  variant?: Variant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 h-11 text-sm font-medium transition select-none",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={clsx(
        "rounded-2xl bg-[var(--card)] text-[var(--card-foreground)] border border-[var(--border)] shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        "w-full rounded-xl bg-[var(--card)] border border-[var(--border)] px-3 h-11 outline-none focus:border-[var(--primary)] transition",
        className
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={clsx(
        "w-full rounded-xl bg-[var(--card)] border border-[var(--border)] px-3 h-11 outline-none focus:border-[var(--primary)] transition",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={clsx(
        "w-full rounded-xl bg-[var(--card)] border border-[var(--border)] px-3 py-2 outline-none focus:border-[var(--primary)] transition",
        className
      )}
      {...props}
    />
  );
}

export function Label({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <label
      className={clsx(
        "block text-xs font-medium text-[var(--muted)] mb-1.5",
        className
      )}
    >
      {children}
    </label>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle ? (
          <p className="text-sm text-[var(--muted)] mt-0.5">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Card className="p-6 text-center">
      <p className="font-medium">{title}</p>
      {description ? (
        <p className="text-sm text-[var(--muted)] mt-1">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </Card>
  );
}
