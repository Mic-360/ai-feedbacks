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

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="flex flex-col gap-4 w-full max-w-xl border border-border/60 bg-card p-5"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold">Register a project</h2>
        <p className="text-xs text-muted-foreground">
          Add the website URL you want to capture feedback from and the public GitHub repo it belongs to.
        </p>
      </div>

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
          <Field>
            <FieldLabel htmlFor={field.name}>Website URL</FieldLabel>
            <Input
              id={field.name}
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="https://example.com"
              aria-invalid={field.state.meta.errors.length > 0}
            />
            <FieldError errors={field.state.meta.errors.map((e: unknown) => ({ message: typeof e === "string" ? e : (e as { message?: string } | undefined)?.message }))} />
          </Field>
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
          <Field>
            <FieldLabel htmlFor={field.name}>GitHub repo URL</FieldLabel>
            <Input
              id={field.name}
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="https://github.com/owner/repo"
              aria-invalid={field.state.meta.errors.length > 0}
            />
            <FieldError errors={field.state.meta.errors.map((e: unknown) => ({ message: typeof e === "string" ? e : (e as { message?: string } | undefined)?.message }))} />
          </Field>
        )}
      </form.Field>

      {submitError && (
        <p className="text-xs text-destructive" role="alert">
          {submitError}
        </p>
      )}

      <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
        {([canSubmit, isSubmitting]) => (
          <Button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : null}
            {isSubmitting ? "Creating…" : "Create project"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
