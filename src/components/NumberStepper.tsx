"use client";

import clsx from "clsx";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

/**
 * Big +/- stepper for fast set logging.
 * - Tap +/- once to bump by `step`.
 * - Press and hold to ramp continuously (faster after a brief warm-up).
 * - Tap the number to type a value with the keyboard.
 * - Optional `onSubmitEdit` lets the parent commit-on-Enter from the field.
 */
export function NumberStepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max,
  unit,
  label,
  decimals,
  className,
}: {
  value: number | null;
  onChange: (next: number) => void;
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
  label?: string;
  /** Force display precision; default = step's natural precision. */
  decimals?: number;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const dp = useMemo(() => {
    if (typeof decimals === "number") return decimals;
    const stepStr = String(step);
    const dot = stepStr.indexOf(".");
    return dot === -1 ? 0 : stepStr.length - dot - 1;
  }, [decimals, step]);

  const display = useMemo(() => {
    const v = value ?? 0;
    return dp > 0 ? v.toFixed(dp) : String(Math.round(v));
  }, [value, dp]);

  const clamp = useCallback(
    (n: number) => {
      let next = n;
      if (typeof min === "number") next = Math.max(min, next);
      if (typeof max === "number") next = Math.min(max, next);
      // Avoid floating-point fuzz for nice display values.
      const factor = Math.pow(10, Math.max(dp, 4));
      return Math.round(next * factor) / factor;
    },
    [min, max, dp]
  );

  const bump = useCallback(
    (dir: 1 | -1) => {
      const base = value ?? 0;
      onChange(clamp(base + dir * step));
    },
    [value, step, clamp, onChange]
  );

  // Long-press ramp: tap once immediately, then after a hold-delay start
  // bumping rapidly. We use Pointer events so it works on touch and mouse.
  const holdTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  function startHold(dir: 1 | -1) {
    bump(dir);
    holdTimeout.current = setTimeout(() => {
      let speed = 90;
      holdInterval.current = setInterval(() => {
        bump(dir);
        // Gradually accelerate
        if (speed > 35) {
          speed = Math.max(35, speed - 6);
          if (holdInterval.current) clearInterval(holdInterval.current);
          holdInterval.current = setInterval(() => bump(dir), speed);
        }
      }, speed);
    }, 380);
  }
  function endHold() {
    if (holdTimeout.current) clearTimeout(holdTimeout.current);
    if (holdInterval.current) clearInterval(holdInterval.current);
    holdTimeout.current = null;
    holdInterval.current = null;
  }
  useEffect(() => () => endHold(), []);

  function handlePointerDown(
    e: ReactPointerEvent<HTMLButtonElement>,
    dir: 1 | -1
  ) {
    e.preventDefault();
    (e.currentTarget as HTMLButtonElement).setPointerCapture?.(e.pointerId);
    startHold(dir);
  }

  function commitDraft() {
    setEditing(false);
    if (!draft.trim()) return;
    const num = parseFloat(draft.replace(",", "."));
    if (Number.isFinite(num)) onChange(clamp(num));
  }

  function startEdit() {
    setDraft(value != null ? String(value) : "");
    setEditing(true);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }

  return (
    <div className={clsx("text-center", className)}>
      {label ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)] mb-2">
          {label}
        </p>
      ) : null}

      <div className="flex items-center justify-center gap-3">
        <StepperButton
          onPointerDown={(e) => handlePointerDown(e, -1)}
          onPointerUp={endHold}
          onPointerCancel={endHold}
          onPointerLeave={endHold}
          ariaLabel="decrease"
        >
          <Minus />
        </StepperButton>

        <button
          type="button"
          onClick={startEdit}
          className="min-w-[120px] px-2 py-1 rounded-2xl active:bg-[var(--surface-2)] transition"
        >
          {editing ? (
            <input
              ref={inputRef}
              inputMode="decimal"
              type="number"
              step={step}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitDraft}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitDraft();
                }
                if (e.key === "Escape") setEditing(false);
              }}
              className="w-full bg-transparent border-none outline-none text-center text-5xl font-bold tabular-nums tracking-tight"
            />
          ) : (
            <div className="leading-none">
              <span className="block text-5xl font-bold tabular-nums tracking-tight">
                {display}
              </span>
              {unit ? (
                <span className="block text-xs text-[var(--foreground-muted)] mt-1.5 font-medium uppercase tracking-wider">
                  {unit}
                </span>
              ) : null}
            </div>
          )}
        </button>

        <StepperButton
          onPointerDown={(e) => handlePointerDown(e, 1)}
          onPointerUp={endHold}
          onPointerCancel={endHold}
          onPointerLeave={endHold}
          ariaLabel="increase"
        >
          <Plus />
        </StepperButton>
      </div>
    </div>
  );
}

function StepperButton({
  ariaLabel,
  children,
  ...props
}: {
  ariaLabel: string;
  children: React.ReactNode;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "aria-label">) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className="w-14 h-14 rounded-full bg-[var(--surface-2)] border border-[var(--border)] active:bg-[var(--primary-soft)] active:border-[var(--primary)] active:scale-95 transition flex items-center justify-center text-[var(--foreground)]"
      {...props}
    >
      {children}
    </button>
  );
}

function Minus() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M5 12h14" />
    </svg>
  );
}
function Plus() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M5 12h14M12 5v14" />
    </svg>
  );
}
