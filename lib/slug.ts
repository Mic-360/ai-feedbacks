export function slugFromWebsiteUrl(url: string): string {
  let hostname: string;
  try {
    const u = new URL(url);
    hostname = u.hostname;
  } catch {
    throw new Error("invalid url");
  }
  if (!hostname) throw new Error("invalid url");

  const stripped = hostname.replace(/^www\./i, "").toLowerCase();
  const slug = stripped.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (!slug) throw new Error("invalid url");
  return slug;
}
