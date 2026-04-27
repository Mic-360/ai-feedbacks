import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

function formatMastDate(d: Date): string {
  const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
  return `${String(d.getDate()).padStart(2, "0")} ${month} · ${d.getFullYear()}`;
}

export function Navbar() {
  const now = new Date();
  const issue = String(dayOfYear(now)).padStart(4, "0");
  const dateLine = formatMastDate(now);

  return (
    <header className="w-full bg-[var(--paper)]">
      <div className="border-t border-[var(--rule)]" />
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-3 items-center gap-4 py-5">
          <div className="ms-cap text-[var(--ink)] tnum">
            VOL. I &nbsp;·&nbsp; ISSUE №&nbsp;{issue}
          </div>

          <Link href="/" className="flex flex-col items-center text-center transition-opacity hover:opacity-80">
            <span
              className="serif-display"
              style={{
                fontSize: "26px",
                letterSpacing: "-0.01em",
                lineHeight: 1,
                fontVariationSettings: '"SOFT" 30',
              }}
            >
              AI Feedbacks Dispatch
            </span>
            <span className="ms-cap mt-1 text-[var(--mute)]" style={{ letterSpacing: "0.18em" }}>
              The Bug·Report Gazette — Est. 2026
            </span>
          </Link>

          <div className="flex items-center justify-end gap-4">
            <span className="ms-cap tnum text-[var(--ink)] hidden sm:inline">{dateLine}</span>
            <ThemeToggle />
          </div>
        </div>
      </div>
      <div className="double-rule" />
    </header>
  );
}
