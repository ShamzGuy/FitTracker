import clsx from "clsx";
import Link, { type LinkProps } from "next/link";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold hover:bg-[var(--primary-hover)] active:scale-[0.98]",
  secondary:
    "bg-[var(--surface-2)] text-[var(--foreground)] hover:bg-[var(--surface-3)] active:scale-[0.98]",
  ghost:
    "bg-transparent text-[var(--foreground)] hover:bg-[var(--surface-2)] active:scale-[0.98]",
  danger:
    "bg-[var(--danger)] text-white font-semibold hover:opacity-90 active:scale-[0.98]",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3 text-sm rounded-[12px]",
  md: "h-12 px-5 text-[15px] rounded-[14px]",
  lg: "h-14 px-6 text-base rounded-[16px]",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 transition-all select-none disabled:opacity-50 disabled:pointer-events-none",
        variantClasses[variant],
        sizeClasses[size],
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
  size = "md",
  className,
  children,
  ...props
}: LinkProps & {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      className={clsx(
        "inline-flex items-center justify-center gap-2 transition-all select-none",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}

export function IconButton({
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--surface-2)] hover:bg-[var(--surface-3)] active:scale-[0.94] transition text-[var(--foreground)] disabled:opacity-50 disabled:pointer-events-none",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({
  className,
  children,
  onClick,
}: {
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        "rounded-[18px] bg-[var(--surface)] shadow-[var(--shadow-card)]",
        onClick && "cursor-pointer active:scale-[0.99] transition-transform",
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
        "w-full rounded-[14px] bg-[var(--surface-2)] px-4 h-12 outline-none ring-1 ring-transparent focus:ring-[var(--primary)] focus:bg-white transition placeholder:text-[var(--foreground-subtle)]",
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
        "w-full rounded-[14px] bg-[var(--surface-2)] px-4 h-12 outline-none ring-1 ring-transparent focus:ring-[var(--primary)] transition appearance-none bg-no-repeat",
        className
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'><path d='M1 1.5L6 6.5L11 1.5' stroke='%23756c61' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/></svg>\")",
        backgroundPosition: "right 16px center",
        paddingRight: 40,
      }}
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
        "w-full rounded-[14px] bg-[var(--surface-2)] px-4 py-3 outline-none ring-1 ring-transparent focus:ring-[var(--primary)] transition placeholder:text-[var(--foreground-subtle)]",
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
        "block text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-muted)] mb-2",
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
    <div className="flex items-end justify-between gap-3 mb-6 mt-2">
      <div className="min-w-0">
        <h1 className="text-[28px] leading-tight font-bold tracking-tight">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-sm text-[var(--foreground-muted)] mt-1 truncate">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function SectionTitle({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between mb-3 px-1">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">
        {children}
      </h2>
      {action}
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
    <Card className="p-8 text-center">
      <p className="font-semibold">{title}</p>
      {description ? (
        <p className="text-sm text-[var(--foreground-muted)] mt-2">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </Card>
  );
}

export function Badge({
  children,
  variant = "default",
}: {
  children: ReactNode;
  variant?: "default" | "primary" | "accent";
}) {
  const styles = {
    default: "bg-[var(--surface-2)] text-[var(--foreground-muted)]",
    primary: "bg-[var(--primary-soft)] text-[var(--primary)]",
    accent: "bg-[var(--accent)]/15 text-[var(--accent)]",
  }[variant];

  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold",
        styles
      )}
    >
      {children}
    </span>
  );
}
