function formatTime(d: Date): string {
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
  return `${h}:${m} · ${String(d.getDate()).padStart(2, "0")} ${month} ${d.getFullYear()}`;
}

export function Footer() {
  const compiled = formatTime(new Date());
  return (
    <footer className="w-full mt-auto bg-[var(--paper)]">
      <div className="double-rule" />
      <div className="container mx-auto px-4 py-6">
        <div className="ms-cap tnum text-[var(--mute)] text-center leading-relaxed">
          Set in Fraunces, Newsreader, Mona Sans, and JetBrains Mono.
          <br className="sm:hidden" />
          <span className="hidden sm:inline"> &nbsp;·&nbsp; </span>
          Compiled at {compiled}.
          <span className="hidden sm:inline"> &nbsp;·&nbsp; </span>
          <br className="sm:hidden" />
          All rights reserved. № Vol. I.
        </div>
      </div>
      <div className="border-t border-[var(--rule)]" />
    </footer>
  );
}
