export interface FixVersion {
  v: number;
  generatedAt: string;
  modelId: string;
  body: string;
}

const FRONT_RE = /^<!-- projectSlug: .+ \| feedbackId: .+ -->\n\n/;

export function createEmpty(args: {
  projectSlug: string;
  feedbackId: string;
}): string {
  return `<!-- projectSlug: ${args.projectSlug} | feedbackId: ${args.feedbackId} -->\n\n`;
}

export function appendVersion(existing: string, version: FixVersion): string {
  const block = `## Version ${version.v} — ${version.generatedAt} (${version.modelId})\n\n${version.body}\n\n`;
  const m = FRONT_RE.exec(existing);
  if (!m) {
    return block + existing;
  }
  const headEnd = m.index + m[0].length;
  const head = existing.slice(0, headEnd);
  const tail = existing.slice(headEnd);
  return head + block + tail;
}

export function parseVersions(content: string): FixVersion[] {
  const re = /^## Version (\d+) — (.+) \((.+)\)$/gm;
  const headers: Array<{
    v: number;
    generatedAt: string;
    modelId: string;
    start: number;
    end: number;
  }> = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    headers.push({
      v: Number(m[1]),
      generatedAt: m[2]!,
      modelId: m[3]!,
      start: m.index,
      end: m.index + m[0].length,
    });
  }
  const versions: FixVersion[] = [];
  for (let i = 0; i < headers.length; i++) {
    const cur = headers[i]!;
    const next = headers[i + 1];
    const bodyStart = cur.end + 1;
    const bodyEnd = next ? next.start : content.length;
    let body = content.slice(bodyStart, bodyEnd);
    body = body.replace(/^\n+/, "").replace(/\n+$/, "");
    versions.push({
      v: cur.v,
      generatedAt: cur.generatedAt,
      modelId: cur.modelId,
      body,
    });
  }
  return versions;
}
