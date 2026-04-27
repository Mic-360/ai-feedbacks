"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SearchBar({
  projectSlug,
  onResults,
}: {
  projectSlug: string;
  onResults: (ids: string[] | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const q = query.trim();
    if (!q) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectSlug, query: q }),
      });
      const data = (await res.json()) as { matchingIds?: string[]; error?: string };
      if (!res.ok || !data.matchingIds) {
        setError(data.error ?? "search failed");
        return;
      }
      onResults(data.matchingIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : "network error");
    } finally {
      setPending(false);
    }
  }

  function clear() {
    setQuery("");
    setError(null);
    onResults(null);
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex flex-col sm:flex-row gap-3 sm:items-end w-full"
      >
        <div className="flex-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. login button issues, broken nav on mobile, slow checkout…"
            className="w-full bg-transparent border-0 border-b border-(--rule) focus:border-(--ink) outline-none px-0 py-2 text-base serif-body italic placeholder:text-(--mute) transition-colors"
          />
        </div>
        <Button
          type="submit"
          variant="default"
          disabled={pending || !query.trim()}
          className="h-9 px-4"
        >
          {pending ? <Loader2 className="animate-spin size-3" /> : null}
          File Query →
        </Button>
        {(query || pending) && (
          <Button
            type="button"
            variant="ghost"
            onClick={clear}
            className="h-9 px-3"
            style={{ fontStyle: "italic", textTransform: "none", letterSpacing: 0, fontFamily: "var(--font-body)" }}
          >
            Reset
          </Button>
        )}
      </form>
      {error && <p className="text-[11px] italic serif-body marker">{error}</p>}
    </div>
  );
}
