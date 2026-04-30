"use client";

import { useEffect } from "react";
import clsx from "clsx";

/**
 * Bottom sheet — slides up from the bottom of the viewport.
 * Closes on backdrop tap or Escape key. Body scroll is locked while open.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = original;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div
        className="absolute inset-0 bg-black/60 animate-fade-in"
        onClick={onClose}
      />
      <div
        className={clsx(
          "relative bg-[var(--surface)] border-t border-[var(--border)]",
          "rounded-t-[24px] shadow-[0_-12px_40px_-12px_rgba(0,0,0,0.6)]",
          "max-h-[90vh] flex flex-col animate-sheet-up",
          "pb-safe"
        )}
      >
        <div className="flex justify-center pt-2 pb-1 shrink-0">
          <div className="w-9 h-1 rounded-full bg-[var(--border-strong)]" />
        </div>
        {title ? (
          <div className="px-5 pt-2 pb-1 shrink-0">
            <p className="text-base font-semibold">{title}</p>
          </div>
        ) : null}
        <div className="px-5 pt-3 pb-4 overflow-y-auto scroll-thin flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
