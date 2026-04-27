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
    <div className="container mx-auto w-full px-4 py-12 flex flex-col gap-10">
      <section className="flex flex-col items-center text-center gap-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/1/1d/Google_Gemini_icon_2025.svg"
            alt="Gemini"
            className="w-3.5 h-3.5"
          />
          Gemini 3 powered feedback workflow
        </div>
        <h1 className="font-heading text-4xl sm:text-5xl font-extrabold tracking-tight max-w-3xl">
          Per-project feedback, ready for{" "}
          <span className="text-primary">your coding agent</span>
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
          Register a website + GitHub repo. The browser extension captures issues, and Gemini
          turns them into actionable fix prompts grounded in your codebase.
        </p>
      </section>

      <section className="flex justify-center">
        <NewProjectForm />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Your projects
        </h2>
        {storageError && (
          <div className="border border-destructive/40 bg-destructive/5 text-destructive p-3 text-xs">
            <p className="font-semibold mb-1">Storage backend unreachable</p>
            <p className="opacity-80">{storageError}</p>
          </div>
        )}
        {projects.length === 0 ? (
          <div className="border border-dashed border-border/60 bg-muted/10 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No projects yet. Register your first one above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {projects.map((p) => (
              <ProjectCard key={p.slug} project={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
