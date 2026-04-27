import { listProjects, type ProjectSummary } from "@/lib/projects";
import { NewProjectForm } from "@/components/project/NewProjectForm";
import { ProjectCard } from "@/components/project/ProjectCard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Home() {
  let projects: ProjectSummary[] = [];
  let storageError: string | null = null;
  try {
    projects = await listProjects();
  } catch (err) {
    storageError = err instanceof Error ? err.message : "failed to reach storage backend";
    console.error("[home] listProjects failed:", err);
  }

  return (
    <div className="container mx-auto w-full px-4 py-12 flex flex-col gap-12">
      {/* Hero — № 01, THE PROPOSITION */}
      <section className="flex flex-col gap-6">
        <div className="eyebrow-mute tnum">№ 01 — The Proposition</div>
        <div className="dropcap-block serif-body" style={{ fontSize: "22px", lineHeight: 1.5, textAlign: "justify", maxWidth: "62ch" }}>
          A centralized command center for incoming feedback and bug reports. Register a project, and the pipeline activates—raw user feedback captured from your apps arrives here, which is then processed by AI into structured, actionable tasks ready for coding agents.
        </div>
        <div className="border-t border-(--rule)" />
      </section>

      {/* 5/7 split — File a new title + Table of contents */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="text-4xl">Register a New Project</div>
          <p className="serif-body italic dark:text-primary-foreground text-primary" style={{ fontSize: "15px", lineHeight: 1.5 }}>
            Add a project to begin receiving and processing user feedback.
          </p>
          <div className="border-t border-(--rule) pt-5">
            <NewProjectForm />
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl">Active Projects</h2>
            <span className="ms-cap tnum text-(--mute)">{String(projects.length).padStart(2, "0")} on file</span>
          </div>
          <div className="border-t border-(--rule-strong)" />
          {storageError && (
            <div className="border border-(--marker) p-4 text-xs serif-body" role="alert">
              <p className="eyebrow marker mb-1">Storage Backend Unreachable</p>
              <p className="text-(--ink-soft)">{storageError}</p>
            </div>
          )}
          {projects.length === 0 && !storageError ? (
            <div className="py-16 flex flex-col items-center gap-3 text-center">
              <div className="flex items-center gap-3">
                <span className="marker text-2xl serif-display">§</span>
                <p className="serif-display italic" style={{ fontSize: "22px" }}>
                  &ldquo;No projects on file. Begin by registering a new project above.&rdquo;
                </p>
                <span className="marker text-2xl serif-display">§</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-96 overflow-y-auto">
              {projects.map((p, idx) => (
                <ProjectCard key={p.slug} project={p} index={idx + 1} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
