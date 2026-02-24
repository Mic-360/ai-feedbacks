import { format } from "date-fns";
import { Copy, Check, Clock, Sparkles } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export interface FeedbackData {
    id: string;
    image?: string;
    description: string;
    createdAt: string;
    prompt?: string;
    isOptimistic?: boolean;
}

export function FeedbackCard({ feedback }: { feedback: FeedbackData }) {
    const [copied, setCopied] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleCopy = () => {
        if (!feedback.prompt) return;
        navigator.clipboard.writeText(feedback.prompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setIsOpen(true)}
                className={`cursor-pointer aspect-square rounded border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col group ${feedback.isOptimistic ? "border-primary/50 shadow-[0_0_20px_rgba(135,174,115,0.2)]" : "border-border shadow-md hover:border-primary/50 transition-colors"}`}
            >
                {/* Image Section */}
                <div className="flex-1 bg-muted/30 p-4 border-b border-border/50 flex flex-col justify-center relative overflow-hidden">
                    {feedback.image ? (
                        <img
                            src={feedback.image}
                            alt="Issue crop"
                            className="rounded object-cover w-full h-full border border-border/50 bg-background/50 shadow-inner group-hover:scale-[1.03] transition-transform duration-500"
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center rounded border border-dashed border-border/50 bg-background/20">
                            <span className="text-muted-foreground text-sm font-medium animate-pulse">Processing...</span>
                        </div>
                    )}
                </div>

                {/* Content Section */}
                <div className="p-4 flex flex-col gap-2 h-[45%] bg-card">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center text-xs text-muted-foreground gap-1.5 focus:outline-none">
                            <Clock className="w-3.5 h-3.5" />
                            <time dateTime={feedback.createdAt}>
                                {format(new Date(feedback.createdAt), "PP")}
                            </time>
                        </div>
                        {feedback.prompt ? (
                            <Sparkles className="w-4 h-4 text-primary" />
                        ) : (
                            <Sparkles className="w-4 h-4 text-muted-foreground animate-pulse" />
                        )}
                    </div>

                    <div>
                        <p className="text-foreground text-sm font-medium leading-relaxed line-clamp-3">{feedback.description}</p>
                    </div>
                </div>
            </motion.div>

            {/* Dialog for details */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[800px] w-[95vw] max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl rounded p-6">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            Feedback Details {feedback.isOptimistic && <span className="text-xs text-primary animate-pulse">(Processing...)</span>}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Image Panel */}
                        <div className="md:w-5/12 bg-muted/30 rounded border border-border/50 p-2 flex flex-col items-center justify-center">
                            {feedback.image && (
                                <img
                                    src={feedback.image}
                                    alt="Issue Full"
                                    className="rounded object-contain w-full max-h-[300px]"
                                />
                            )}
                        </div>

                        {/* Details Panel */}
                        <div className="md:w-7/12 flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-primary/80 bg-primary/10 px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider">
                                    Issue {feedback.id?.slice(0, 8) || "..."}
                                </div>
                                <div className="flex items-center text-xs text-muted-foreground gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                    <Clock className="w-3.5 h-3.5" />
                                    <time dateTime={feedback.createdAt}>
                                        {format(new Date(feedback.createdAt), "PPp")}
                                    </time>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground mb-1 uppercase tracking-widest">Description</h3>
                                <p className="text-foreground text-sm font-medium leading-relaxed">{feedback.description}</p>
                            </div>

                            <div className="mt-2 grow flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-widest">
                                        <Sparkles className="w-4 h-4 text-primary" /> Generated Prompt
                                    </h3>
                                    {feedback.prompt && (
                                        <button
                                            onClick={handleCopy}
                                            className="text-xs flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors p-1 rounded active:bg-primary/20"
                                            aria-label="Copy prompt"
                                        >
                                            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                            {copied ? "Copied" : "Copy"}
                                        </button>
                                    )}
                                </div>

                                <div className="bg-muted/30 border border-border/50 rounded p-4 grow relative transition-colors max-h-[400px] overflow-y-auto">
                                    {feedback.prompt ? (
                                        <p className="text-sm font-mono text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                            {feedback.prompt}
                                        </p>
                                    ) : (
                                        <div className="flex items-center justify-center h-full min-h-[100px] text-muted-foreground text-sm animate-pulse flex-col gap-2">
                                            <Sparkles className="w-6 h-6 text-primary/50" />
                                            Gemini is crafting the ideal prompt...
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
