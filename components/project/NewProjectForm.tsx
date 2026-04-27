"use client";

import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

function isUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function NewProjectForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      websiteUrl: "",
      repoUrl: "",
    },
    onSubmit: async ({ value }) => {
      setSubmitError(null);
      try {
        const res = await fetch("/api/project/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(value),
        });
        const data = (await res.json()) as { slug?: string; error?: string };
        if (!res.ok || !data.slug) {
          setSubmitError(data.error ?? "failed to create project");
          return;
        }
        router.push(`/project/${data.slug}`);
        router.refresh();
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : "network error");
      }
    },
  });

  const inputCls =
    "w-full bg-transparent border-0 border-b border-[var(--rule)] focus:border-[var(--ink)] outline-none px-0 py-2 text-base serif-body placeholder:text-[var(--mute)] placeholder:italic transition-colors";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="flex flex-col gap-6 w-full"
    >
      <form.Field
        name="websiteUrl"
        validators={{
          onChange: ({ value }) =>
            !value
              ? "websiteUrl is required"
              : !isUrl(value)
                ? "must be a valid http(s) URL"
                : undefined,
        }}
      >
        {(field) => (
          <div className="flex flex-col gap-1">
            <label htmlFor={field.name} className="eyebrow">
              Website URL
            </label>
            <input
              id={field.name}
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="https://example.com"
              aria-invalid={field.state.meta.errors.length > 0}
              className={inputCls}
            />
            {field.state.meta.errors.length > 0 && (
              <p className="text-[11px] italic serif-body marker mt-1">
                {typeof field.state.meta.errors[0] === "string"
                  ? field.state.meta.errors[0]
                  : (field.state.meta.errors[0] as { message?: string } | undefined)?.message}
              </p>
            )}
          </div>
        )}
      </form.Field>

      <form.Field
        name="repoUrl"
        validators={{
          onChange: ({ value }) =>
            !value
              ? "repoUrl is required"
              : !/^https:\/\/github\.com\/[^/]+\/[^/]+/.test(value)
                ? "must be a github.com/owner/repo URL"
                : undefined,
        }}
      >
        {(field) => (
          <div className="flex flex-col gap-1">
            <label htmlFor={field.name} className="eyebrow">
              GitHub Repository
            </label>
            <input
              id={field.name}
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="https://github.com/owner/repo"
              aria-invalid={field.state.meta.errors.length > 0}
              className={inputCls}
            />
            {field.state.meta.errors.length > 0 && (
              <p className="text-[11px] italic serif-body marker mt-1">
                {typeof field.state.meta.errors[0] === "string"
                  ? field.state.meta.errors[0]
                  : (field.state.meta.errors[0] as { message?: string } | undefined)?.message}
              </p>
            )}
          </div>
        )}
      </form.Field>

      {submitError && (
        <p className="text-[11px] italic serif-body marker" role="alert">
          {submitError}
        </p>
      )}

      <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
        {([canSubmit, isSubmitting]) => (
          <div className="pt-2">
            <Button
              type="submit"
              variant={canSubmit && !isSubmitting ? "editorial" : "editorial-ghost"}
              size="lg"
              disabled={!canSubmit || isSubmitting}
              className="px-5 h-10"
            >
              {isSubmitting ? <Loader2 className="animate-spin size-3" /> : null}
              {isSubmitting ? "Filing…" : "File for Review →"}
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  );
}
