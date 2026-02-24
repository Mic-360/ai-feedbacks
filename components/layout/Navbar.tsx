import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export function Navbar() {
    return (
        <header className="sticky top-0 z-50 w-full bg-transparent backdrop-blur-xl">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
                    <div className="flex h-10 w-10 items-center justify-center rounded overflow-hidden">
                        <img src="/logo.png" alt="AI Feedbacks Logo" className="object-contain w-full h-full" />
                    </div>
                    <span className="font-heading text-xl font-bold tracking-tight">AI Feedbacks</span>
                </Link>
                <nav className="flex items-center gap-4">
                    <Link href="/feedbacks" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                        Explore
                    </Link>
                    <ThemeToggle />
                </nav>
            </div>
        </header>
    );
}
