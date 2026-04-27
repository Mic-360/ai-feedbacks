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

export function ProjectCard({ project, index }: { project: ProjectSummary; index?: number }) {
  const num = typeof index === "number" ? String(index).padStart(2, "0") : "—";
  return (
    <Link
      href={`/project/${project.slug}`}
      className="group grid grid-cols-12 items-baseline gap-4 py-5 border-b border-[var(--rule)] transition-colors hover:bg-[rgba(0,0,0,0.03)]"
    >
      <div className="col-span-2 sm:col-span-1 ms-cap tnum text-[var(--mute)]">№ {num}</div>

      <div className="col-span-10 sm:col-span-8 flex flex-col gap-1 min-w-0">
        <span
          className="serif-display truncate"
          style={{ fontSize: "22px", letterSpacing: "-0.015em", lineHeight: 1.15 }}
        >
          {hostname(project.websiteUrl)}
        </span>
        <span className="ms-cap text-[var(--mute)] truncate">
          {repoLabel(project.repoUrl)} &nbsp;·&nbsp; {project.feedbackCount} {project.feedbackCount === 1 ? "dispatch" : "dispatches"}
        </span>
      </div>

      <div className="col-span-12 sm:col-span-3 flex items-center justify-end gap-3">
        <ContextStatusBadge state={project.contextJobState} />
        <span className="ms-cap text-[var(--ink)] transition-transform group-hover:translate-x-[2px]">→</span>
      </div>
    </Link>
  );
}
