"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";

export function StartWorkoutButton({
  templateId,
  label,
  variant = "primary",
}: {
  templateId?: string;
  label?: string;
  variant?: "primary" | "secondary";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function start() {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      let name: string | null = null;
      if (templateId) {
        const { data: tpl } = await supabase
          .from("templates")
          .select("name")
          .eq("id", templateId)
          .maybeSingle();
        name = tpl?.name ?? null;
      }

      const { data: workout, error } = await supabase
        .from("workouts")
        .insert({
          user_id: user.id,
          template_id: templateId ?? null,
          name,
        })
        .select()
        .single();

      if (error || !workout) throw error ?? new Error("Failed to start workout");

      router.push(`/workout/${workout.id}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  if (templateId) {
    return (
      <button
        onClick={start}
        disabled={loading}
        className="text-left rounded-[18px] bg-[var(--surface)] shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] active:scale-[0.99] transition-all p-4 disabled:opacity-50 disabled:pointer-events-none"
      >
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className="font-semibold truncate">
            {loading ? "Starting…" : label}
          </p>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--primary)] shrink-0">
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </div>
        <p className="text-[11px] uppercase tracking-wider text-[var(--foreground-muted)] font-semibold">
          Tap to start
        </p>
      </button>
    );
  }

  return (
    <Button
      onClick={start}
      disabled={loading}
      variant={variant}
      size="lg"
      className="w-full"
    >
      {loading ? "Starting…" : label ?? "Start empty workout"}
    </Button>
  );
}
