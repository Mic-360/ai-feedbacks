import { Heart } from "lucide-react";

export function Footer() {
    return (
        <footer className="w-full border-t border-border/40 bg-background/40 backdrop-blur-md mt-auto">
            <div className="container mx-auto flex flex-col items-center justify-center gap-2 py-8 px-4 text-center sm:flex-row sm:justify-between sm:text-left">
                <div className="text-sm text-muted-foreground">
                    © {new Date().getFullYear()} AI Feedbacks. All rights reserved.
                </div>
                <div className="flex items-center text-sm font-medium text-muted-foreground">
                    Built with <Heart className="mx-1 h-4 w-4 fill-red-500 text-red-500 animate-pulse" /> by bhaumic
                </div>
            </div>
        </footer>
    );
}
