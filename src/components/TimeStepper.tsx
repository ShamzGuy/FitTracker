"use client";

import { useMemo } from "react";
import { NumberStepper } from "@/components/NumberStepper";

/**
 * Two-stepper composer for time-based exercises (Plank, Elliptical, etc).
 * Stores everything as total seconds; UI splits into minutes + seconds.
 */
export function TimeStepper({
  totalSeconds,
  onChange,
  label,
}: {
  totalSeconds: number | null;
  onChange: (seconds: number) => void;
  label?: string;
}) {
  const { minutes, seconds } = useMemo(() => {
    const t = totalSeconds ?? 0;
    return { minutes: Math.floor(t / 60), seconds: t % 60 };
  }, [totalSeconds]);

  function setMinutes(m: number) {
    onChange(Math.max(0, m * 60 + seconds));
  }
  function setSeconds(s: number) {
    let m = minutes;
    let sec = s;
    while (sec >= 60) {
      sec -= 60;
      m += 1;
    }
    while (sec < 0) {
      sec += 60;
      m -= 1;
    }
    if (m < 0) {
      m = 0;
      sec = 0;
    }
    onChange(m * 60 + sec);
  }

  return (
    <div>
      {label ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)] mb-3 text-center">
          {label}
        </p>
      ) : null}
      <div className="space-y-4">
        <NumberStepper
          value={minutes}
          onChange={setMinutes}
          step={1}
          min={0}
          unit="min"
        />
        <NumberStepper
          value={seconds}
          onChange={setSeconds}
          step={5}
          min={0}
          max={59}
          unit="sec"
        />
      </div>
    </div>
  );
}
