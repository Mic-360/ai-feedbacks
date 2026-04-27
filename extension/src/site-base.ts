const DEFAULT_SITE_BASE_URL = "https://ai-feedbacks.bhaumicsingh.tech";
const STORAGE_KEY = "siteBaseUrlOverride";

export async function getSiteBaseUrl(): Promise<string> {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  const override = stored[STORAGE_KEY];
  if (typeof override === "string" && override.trim().length > 0) {
    return override.replace(/\/+$/, "");
  }
  return DEFAULT_SITE_BASE_URL;
}

export async function setSiteBaseUrlOverride(value: string | null): Promise<void> {
  if (value === null || value.trim() === "") {
    await chrome.storage.local.remove(STORAGE_KEY);
    return;
  }
  await chrome.storage.local.set({ [STORAGE_KEY]: value.trim().replace(/\/+$/, "") });
}

export const DEFAULT_SITE_BASE_URL_CONST = DEFAULT_SITE_BASE_URL;
