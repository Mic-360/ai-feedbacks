export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { recoverStaleJobs } = await import("@/lib/boot");
    await recoverStaleJobs().catch((e) => {
      console.error("[boot] recoverStaleJobs failed:", e);
    });
  }
}
