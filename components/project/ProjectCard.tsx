"use client";

import Link from "next/link";
import type { ProjectSummary } from "@/lib/projects";
import { ContextStatusBadge } from "./ContextStatusBadge";

function hostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function repoLabel(url: string): string {
  try {
    const u = new URL(url);
    const parts = u.pathname.replace(/^\//, "").split("/");
    if (parts.length >= 2) return `${parts[0]}/${parts[1]}`;
    return url;
  } catch {
    return url;
  }
}

export function ProjectCard({ project }: { project: ProjectSummary }) {
  return (
    <Link
      href={`/project/${project.slug}`}
      className="group flex flex-col gap-3 border border-border/60 bg-card p-4 transition-colors hover:border-primary/40 hover:bg-card/80"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Globe className="size-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium truncate">{hostname(project.websiteUrl)}</span>
        </div>
        <ContextStatusBadge state={project.contextJobState} />
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
        <Code2 className="size-3.5 shrink-0" />
        <span className="truncate">{repoLabel(project.repoUrl)}</span>
      </div>

      <div className="mt-auto flex items-center gap-3 text-xs text-muted-foreground pt-2 border-t border-border/40">
        <span className="inline-flex items-center gap-1">
          <MessageSquare className="size-3.5" />
          {project.feedbackCount} {project.feedbackCount === 1 ? "feedback" : "feedbacks"}
        </span>
      </div>
    </Link>
  );
}
