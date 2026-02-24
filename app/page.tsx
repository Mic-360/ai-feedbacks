"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Bot, Code, Zap } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden px-4 py-24 sm:py-32">
            {/* Background glowing orbs */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/10 rounded blur-[120px] pointer-events-none opacity-50" />
            <div className="absolute top-20 right-20 w-[300px] h-[300px] bg-foreground/5 rounded blur-[100px] pointer-events-none opacity-40" />
            <div className="absolute bottom-20 left-20 w-[400px] h-[400px] bg-primary/5 rounded blur-[100px] pointer-events-none opacity-40" />

            <div className="z-10 container max-w-5xl mx-auto flex flex-col items-center text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8"
                >
                    <img src="https://upload.wikimedia.org/wikipedia/commons/1/1d/Google_Gemini_icon_2025.svg" alt="Gemini" className="w-4 h-4" />
                    <span>Gemini 3 Flash Preview Powered</span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className="font-heading text-5xl sm:text-7xl font-extrabold tracking-tight max-w-4xl"
                >
                    Transform Issues into
                    <br className="hidden sm:block" />
                    <span className="text-primary">
                        {" "}Actionable Prompts
                    </span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl"
                >
                    Upload a screenshot and describe your bug. Our AI instantly analyzes both to generate a ready-to-use prompt for any coding agent.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
                >
                    <Link
                        href="/feedbacks?add=true"
                        className={cn(
                            buttonVariants({ size: "lg" }),
                            "rounded h-14 px-8 text-base shadow-[0_0_40px_rgba(135,174,115,0.15)] hover:shadow-[0_0_60px_rgba(135,174,115,0.3)] transition-all font-semibold"
                        )}
                    >
                        Start Analyzing <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="mt-24 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl"
                >
                    {[
                        {
                            icon: Bot,
                            title: "AI Analysis",
                            description: "Gemini 3 Flash reads your screenshot context instantly.",
                        },
                        {
                            icon: Code,
                            title: "Agent Ready",
                            description: "Generates prompts formatted perfectly for coding agents.",
                        },
                        {
                            icon: Zap,
                            title: "Lightning Fast",
                            description: "Go from issue to solution in mere seconds.",
                        },
                    ].map((feature, i) => (
                        <div
                            key={i}
                            className="flex flex-col items-center text-center p-6 rounded border border-border/50 bg-background/30 backdrop-blur-sm"
                        >
                            <div className="h-12 w-12 rounded bg-primary/10 flex items-center justify-center text-primary mb-4">
                                <feature.icon className="h-6 w-6" />
                            </div>
                            <h3 className="font-heading font-semibold text-lg">{feature.title}</h3>
                            <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}