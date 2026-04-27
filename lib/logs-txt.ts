export interface LogsPayload {
  console: string[];
  unhandledRejections: string[];
  domLength: number;
  domExcerpt: string;
  networkSummary?: Array<{
    method: string;
    url: string;
    status: number;
    durationMs: number;
    timestamp: string;
  }>;
}

const NONE = "(none)";

function section(title: string, body: string): string {
  return `## ${title}\n${body}`;
}

function joinLines(lines: string[]): string {
  return lines.length === 0 ? NONE : lines.join("\n");
}

export function formatLogs(args: {
  projectSlug: string;
  feedbackId: string;
  capturedAt: string;
  logs: LogsPayload;
}): string {
  const { projectSlug, feedbackId, capturedAt, logs } = args;
  const header =
    `# projectSlug: ${projectSlug}\n` +
    `# feedbackId: ${feedbackId}\n` +
    `# capturedAt: ${capturedAt}\n`;

  const consoleSection = section("Console Logs", joinLines(logs.console));
  const rejectionsSection = section(
    "Unhandled Rejections",
    joinLines(logs.unhandledRejections),
  );
  const domSection =
    `## DOM Snapshot (length: ${logs.domLength})\n` + logs.domExcerpt;

  const networkLines =
    logs.networkSummary && logs.networkSummary.length > 0
      ? logs.networkSummary
          .map((n) =>
            JSON.stringify({
              method: n.method,
              url: n.url,
              status: n.status,
              durationMs: n.durationMs,
              timestamp: n.timestamp,
            }),
          )
          .join("\n")
      : NONE;
  const networkSection = section("Network", networkLines);

  return [
    header,
    consoleSection,
    rejectionsSection,
    domSection,
    networkSection,
  ].join("\n");
}

export function parseLogs(content: string): {
  projectSlug: string;
  feedbackId: string;
  capturedAt: string;
  logs: LogsPayload;
} {
  const lines = content.split("\n");

  const projectSlug = matchHeader(lines, "projectSlug");
  const feedbackId = matchHeader(lines, "feedbackId");
  const capturedAt = matchHeader(lines, "capturedAt");

  const sections = splitSections(content);

  const consoleBody = sections.get("Console Logs") ?? "";
  const rejectionsBody = sections.get("Unhandled Rejections") ?? "";
  const networkBody = sections.get("Network") ?? "";

  const domEntry = findDomSection(content);

  const consoleArr = parseListBody(consoleBody);
  const rejectionsArr = parseListBody(rejectionsBody);

  const networkSummary =
    networkBody.trim() === NONE || networkBody.trim() === ""
      ? undefined
      : networkBody
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 0)
          .map((l) => JSON.parse(l) as {
            method: string;
            url: string;
            status: number;
            durationMs: number;
            timestamp: string;
          });

  const logs: LogsPayload = {
    console: consoleArr,
    unhandledRejections: rejectionsArr,
    domLength: domEntry.length,
    domExcerpt: domEntry.excerpt,
    ...(networkSummary ? { networkSummary } : {}),
  };

  return { projectSlug, feedbackId, capturedAt, logs };
}

function matchHeader(lines: string[], key: string): string {
  const prefix = `# ${key}:`;
  for (const l of lines) {
    if (l.startsWith(prefix)) {
      return l.slice(prefix.length).trim();
    }
  }
  return "";
}

function splitSections(content: string): Map<string, string> {
  const result = new Map<string, string>();
  const re = /^## (.+)$/gm;
  const matches: Array<{ title: string; start: number; end: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    matches.push({ title: m[1]!, start: m.index, end: m.index + m[0].length });
  }
  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i]!;
    const next = matches[i + 1];
    const bodyStart = cur.end + 1;
    const bodyEnd = next ? next.start : content.length;
    let body = content.slice(bodyStart, bodyEnd);
    if (body.endsWith("\n")) body = body.slice(0, -1);
    result.set(cur.title, body);
  }
  return result;
}

function findDomSection(content: string): { length: number; excerpt: string } {
  const re = /^## DOM Snapshot \(length: (\d+)\)$/m;
  const m = re.exec(content);
  if (!m) return { length: 0, excerpt: "" };
  const after = content.slice(m.index + m[0].length + 1);
  const nextHeader = /^## /m.exec(after);
  let excerpt = nextHeader ? after.slice(0, nextHeader.index) : after;
  if (excerpt.endsWith("\n")) excerpt = excerpt.slice(0, -1);
  return { length: Number(m[1]), excerpt };
}

function parseListBody(body: string): string[] {
  const trimmed = body.trim();
  if (trimmed === NONE || trimmed === "") return [];
  return body.split("\n").filter((l) => l.length > 0);
}
