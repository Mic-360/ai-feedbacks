export interface ContextHeader {
  projectSlug: string;
  repoUrl: string;
  commitSha: string;
  generatedAt: string;
}

export function wrapContext(header: ContextHeader, body: string): string {
  const line = `<!-- projectSlug: ${header.projectSlug} | repoUrl: ${header.repoUrl} | commitSha: ${header.commitSha} | generatedAt: ${header.generatedAt} -->`;
  return `${line}\n\n${body}`;
}

export function parseContextHeader(content: string): ContextHeader | null {
  const firstLine = content.split("\n", 1)[0] ?? "";
  const m = /^<!--\s*(.+?)\s*-->$/.exec(firstLine);
  if (!m) return null;
  const inner = m[1]!;
  const parts = inner.split("|").map((p) => p.trim());
  const map = new Map<string, string>();
  for (const p of parts) {
    const idx = p.indexOf(":");
    if (idx === -1) continue;
    map.set(p.slice(0, idx).trim(), p.slice(idx + 1).trim());
  }
  const projectSlug = map.get("projectSlug");
  const repoUrl = map.get("repoUrl");
  const commitSha = map.get("commitSha");
  const generatedAt = map.get("generatedAt");
  if (!projectSlug || !repoUrl || !commitSha || !generatedAt) return null;
  return { projectSlug, repoUrl, commitSha, generatedAt };
}
