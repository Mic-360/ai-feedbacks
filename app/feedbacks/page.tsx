"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Sparkles } from "lucide-react";
import { FeedbackCard, FeedbackData } from "@/components/feedback/FeedbackCard";
import { AddFeedbackForm } from "@/components/feedback/AddFeedbackForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function FeedbacksPage() {
    const [feedbacks, setFeedbacks] = useState<FeedbackData[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isNaturalLanguage, setIsNaturalLanguage] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [searchResults, setSearchResults] = useState<FeedbackData[] | null>(null);

    useEffect(() => {
        fetch("/api/feedback")
            .then((res) => res.json())
            .then((data) => {
                if (data.feedbacks) setFeedbacks(data.feedbacks);
            })
            .catch(console.error);
    }, []);

    const handleOptimisticSubmit = (data: FeedbackData) => {
        setFeedbacks((prev) => [data, ...prev]);
        setIsDialogOpen(false);
    };

    const handleSuccessSubmit = (tempId: string, data: FeedbackData) => {
        setFeedbacks((prev) => {
            const index = prev.findIndex(f => f.id === tempId || f.id === data.id);
            if (index === -1) return prev;
            const newArray = [...prev];
            newArray[index] = data;
            return newArray;
        });
    };

    const performNLSearch = async () => {
        if (!searchQuery.trim()) {
            setSearchResults(null);
            return;
        }
        setIsSearching(true);
        try {
            const res = await fetch("/api/feedback/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: searchQuery }),
            });
            const data = await res.json();
            setSearchResults(data.results || []);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSearching(false);
        }
    };

    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults(null);
        } else if (!isNaturalLanguage) {
            // Fuzzy search
            const lower = searchQuery.toLowerCase();
            setSearchResults(
                feedbacks.filter(
                    (f) =>
                        f.description.toLowerCase().includes(lower) ||
                        f.prompt?.toLowerCase().includes(lower)
                )
            );
        }
    }, [searchQuery, isNaturalLanguage, feedbacks]);

    const displayedFeedbacks = searchResults !== null ? searchResults : feedbacks;

    return (
        <div className="container mx-auto px-4 py-12 max-w-6xl flex-1 flex flex-col pt-8 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-border/50">
                <div>
                    <h1 className="font-heading text-4xl font-extrabold tracking-tight text-foreground">
                        Feedbacks
                    </h1>
                    <p className="text-muted-foreground mt-2 font-medium">
                        Explore, search, and generate prompts from community issues.
                    </p>
                </div>
                <Button
                    onClick={() => setIsDialogOpen(true)}
                    className="rounded shadow-[0_0_20px_rgba(135,174,115,0.2)] hover:shadow-[0_0_30px_rgba(135,174,115,0.4)] transition-all font-semibold gap-2 text-black"
                >
                    <Plus className="w-5 h-5" /> Add Feedback
                </Button>
            </div>

            <div className="bg-background/40 border border-border/50 rounded p-4 backdrop-blur-md flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder={isNaturalLanguage ? "Describe the issue conceptually..." : "Search descriptions..."}
                        className="pl-10 h-12 bg-background/50 text-base"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && isNaturalLanguage) performNLSearch();
                        }}
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto shrink-0 bg-muted/30 p-1.5 rounded border border-border/50">
                    <button
                        className={`px-4 py-2 text-sm font-semibold rounded transition-all ${!isNaturalLanguage ? "bg-background text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"}`}
                        onClick={() => setIsNaturalLanguage(false)}
                    >
                        Fuzzy
                    </button>
                    <button
                        className={`px-4 py-2 text-sm font-semibold rounded flex items-center gap-1.5 transition-all ${isNaturalLanguage ? "bg-primary/20 text-primary shadow-sm ring-1 ring-primary/40" : "text-muted-foreground hover:text-foreground"}`}
                        onClick={() => setIsNaturalLanguage(true)}
                    >
                        <Sparkles className="w-4 h-4" /> Natural
                    </button>
                </div>

                {isNaturalLanguage && (
                    <Button
                        onClick={performNLSearch}
                        disabled={isSearching || !searchQuery.trim()}
                        variant="secondary"
                        className="h-12 w-full md:w-auto font-semibold"
                    >
                        {isSearching ? "Searching..." : "Ask Gemini"}
                    </Button>
                )}
            </div>

            <div className="space-y-6">
                {displayedFeedbacks.length === 0 ? (
                    <div className="text-center py-20 bg-muted/10 rounded border border-border/30 border-dashed">
                        <h3 className="text-xl font-semibold text-muted-foreground">No feedbacks found</h3>
                        <p className="text-muted-foreground/60 mt-2">Try a different search query or add a new feedback.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayedFeedbacks.map((f, i) => (
                            <FeedbackCard key={f.id || i} feedback={f} />
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px] bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl p-0 overflow-hidden">
                    <div className="p-6">
                        <DialogHeader className="mb-6">
                            <DialogTitle className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                <Plus className="w-6 h-6 text-primary" /> New Feedback
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
                                Upload your bug screenshot and describe it. Gemini 3 Flash will analyze it to provide a prompt for coding agents.
                            </DialogDescription>
                        </DialogHeader>
                        <AddFeedbackForm
                            onOptimistic={handleOptimisticSubmit}
                            onSuccess={handleSuccessSubmit}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
