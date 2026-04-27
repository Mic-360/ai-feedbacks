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
    <div className="flex flex-col gap-1 w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex gap-2 w-full"
      >
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about your feedbacks: e.g. 'login button issues'"
            className="pl-8"
          />
        </div>
        <Button type="submit" disabled={pending || !query.trim()}>
          {pending ? <Loader2 className="animate-spin" /> : <Search />}
          Search
        </Button>
        {(query || pending) && (
          <Button type="button" variant="ghost" onClick={clear}>
            <X />
            Clear
          </Button>
        )}
      </form>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
