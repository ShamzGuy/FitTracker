"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Label } from "@/components/ui";
import { Sheet } from "@/components/Sheet";

/**
 * Small inline trigger that opens a bottom sheet to edit the user's
 * display name. The name lives in `auth.users.raw_user_meta_data.name`.
 */
export function EditNameButton({ currentName }: { currentName: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed === currentName) {
      setOpen(false);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: { name: trimmed },
      });
      if (error) throw error;
      setOpen(false);
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not save your name.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setName(currentName);
          setError(null);
          setOpen(true);
        }}
        className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:underline"
      >
        <svg
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
        Edit name
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Edit name">
        <form onSubmit={save} className="space-y-3">
          <div>
            <Label htmlFor="edit-display-name">Your name</Label>
            <Input
              id="edit-display-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Shameed"
              autoFocus
              required
              maxLength={40}
            />
          </div>
          {error ? (
            <p className="text-xs text-[var(--danger)]">{error}</p>
          ) : null}
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={saving || !name.trim()}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </Sheet>
    </>
  );
}
