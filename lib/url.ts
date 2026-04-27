export function normalizeUrl(url: string): string {
  const u = new URL(url);
  if (!u.hostname) throw new Error("invalid url");
  return `${u.protocol}//${u.hostname.toLowerCase()}`;
}

export function originMatches(a: string, b: string): boolean {
  try {
    return normalizeUrl(a) === normalizeUrl(b);
  } catch {
    return false;
  }
}
