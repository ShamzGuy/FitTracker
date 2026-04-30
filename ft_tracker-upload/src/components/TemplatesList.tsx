"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui";
import type { Template } from "@/lib/types";

type TemplateWithItems = Template & { exercises: string[] };

export function TemplatesList({
  templates: initial,
}: {
  templates: TemplateWithItems[];
}) {
  const [templates, setTemplates] = useState(initial);

  async function remove(id: string) {
    if (!confirm("Delete this template?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("templates").delete().eq("id", id);
    if (error) {
      alert(error.message);
      return;
    }
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }

  if (templates.length === 0) {
    // Empty UI is handled by the parent page (import-plan card / new button).
    return null;
  }

  return (
    <ul className="space-y-3">
      {templates.map((t) => (
        <li key={t.id}>
          <Card className="p-4">
            <div className="flex items-start justify-between gap-3">
              <Link
                href={`/templates/${t.id}`}
                className="block flex-1 min-w-0"
              >
                <p className="font-medium truncate">{t.name}</p>
                <p className="text-xs text-[var(--muted)] mt-0.5 truncate">
                  {t.exercises.length === 0
                    ? "No exercises yet"
                    : t.exercises.join(" · ")}
                </p>
              </Link>
              <button
                onClick={() => remove(t.id)}
                className="text-xs text-[var(--danger)] font-medium px-2 py-1"
              >
                Delete
              </button>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
