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
          A private editorial gazette of incoming bug-reports. File a publication, equip its house style, and the wire begins to hum — dispatches captured by your extension arrive here as field notes, then drafted into verdicts a coding agent can act on without ceremony.
        </div>
        <div className="border-t border-[var(--rule)]" />
      </section>

      {/* 5/7 split — File a new title + Table of contents */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="eyebrow">File a New Title</div>
          <p className="serif-body italic text-[var(--mute)]" style={{ fontSize: "15px", lineHeight: 1.5 }}>
            Register a publication and we will compose its house style.
          </p>
          <div className="border-t border-[var(--rule)] pt-5">
            <NewProjectForm />
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h2 className="eyebrow">The Table of Contents</h2>
            <span className="ms-cap tnum text-[var(--mute)]">{String(projects.length).padStart(2, "0")} on file</span>
          </div>
          <div className="border-t border-[var(--rule-strong)]" />
          {storageError && (
            <div className="border border-[var(--marker)] p-4 text-xs serif-body" role="alert">
              <p className="eyebrow marker mb-1">Storage Backend Unreachable</p>
              <p className="text-[var(--ink-soft)]">{storageError}</p>
            </div>
          )}
          {projects.length === 0 && !storageError ? (
            <div className="py-16 flex flex-col items-center gap-3 text-center">
              <div className="flex items-center gap-3">
                <span className="marker text-2xl serif-display">§</span>
                <p className="serif-display italic" style={{ fontSize: "22px" }}>
                  &ldquo;No publications on file. Begin with a title above.&rdquo;
                </p>
                <span className="marker text-2xl serif-display">§</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
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
