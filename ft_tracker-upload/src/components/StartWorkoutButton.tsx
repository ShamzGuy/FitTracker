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

  return (
    <Button
      onClick={start}
      disabled={loading}
      variant={variant}
      className={templateId ? "w-full justify-start text-left" : ""}
    >
      {loading ? "Starting…" : label ?? "Start empty workout"}
    </Button>
  );
}
