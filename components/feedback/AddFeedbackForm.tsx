"use client";

import { useForm } from "@tanstack/react-form";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, Loader2, ImagePlus } from "lucide-react";

export function AddFeedbackForm({
    onSuccess,
    onOptimistic
}: {
    onSuccess: (tempId: string, feedback: any) => void;
    onOptimistic: (optimisticData: any) => void;
}) {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm({
        defaultValues: {
            description: "",
        },
        onSubmit: async ({ value }) => {
            if (!file) return;
            setIsSubmitting(true);

            const desc = value.description;

            // Emit optimistic data
            const tempId = "temp-" + Date.now();
            onOptimistic({
                id: tempId,
                image: previewUrl,
                description: desc,
                createdAt: new Date().toISOString(),
                isOptimistic: true
            });

            const formData = new FormData();
            formData.append("image", file);
            formData.append("description", desc);

            try {
                const res = await fetch("/api/feedback/add", {
                    method: "POST",
                    body: formData,
                });

                if (!res.ok) throw new Error("Failed to add feedback");

                const id = res.headers.get("X-Feedback-Id");
                const key = res.headers.get("X-Feedback-Key");
                const imagePath = res.headers.get("X-Image-Path");

                const reader = res.body?.getReader();
                const decoder = new TextDecoder();
                let streamedPrompt = "";

                if (reader) {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        streamedPrompt += decoder.decode(value, { stream: true });

                        onSuccess(tempId, {
                            id,
                            key,
                            image: imagePath,
                            description: desc,
                            createdAt: new Date().toISOString(),
                            prompt: streamedPrompt,
                            isOptimistic: false // we have the real ID, so it's not truly 'optimistic' anymore, just streaming
                        });
                    }
                }

                // Final close
                setFile(null);
                setPreviewUrl(null);
                form.reset();

            } catch (e) {
                console.error("Failed to add feedback", e);
            } finally {
                setIsSubmitting(false);
            }
        },
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            setFile(selected);
            setPreviewUrl(URL.createObjectURL(selected));
        }
    };

    const removeFile = () => {
        setFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="space-y-6">
            <div>
                <Label className="text-muted-foreground uppercase tracking-widest text-xs font-semibold">Screenshot</Label>

                {!previewUrl ? (
                    <div
                        className="mt-2 border-2 border-dashed border-border/60 hover:border-primary/50 transition-colors rounded bg-background/50 flex flex-col items-center justify-center p-8 cursor-pointer relative group"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <Upload className="w-6 h-6" />
                        </div>
                        <p className="mt-4 text-sm font-medium">Click to upload image</p>
                        <p className="mt-1 text-xs text-muted-foreground">PNG, JPG or WEBP up to 5MB</p>
                    </div>
                ) : (
                    <div className="mt-2 relative rounded overflow-hidden border border-border group">
                        <img src={previewUrl} alt="Preview" className="w-full max-h-[300px] object-contain bg-muted/20" />
                        <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                            <Button type="button" variant="destructive" size="sm" onClick={removeFile} className="gap-2">
                                <X className="w-4 h-4" /> Remove Image
                            </Button>
                        </div>
                    </div>
                )}
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                />
            </div>

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit();
                }}
                className="space-y-6"
            >
                <form.Field
                    name="description"
                    validators={{
                        onChange: ({ value }) => !value ? 'Description is required' : undefined,
                    }}
                    children={(field) => (
                        <div className="space-y-2">
                            <Label htmlFor={field.name} className="text-muted-foreground uppercase tracking-widest text-xs font-semibold">
                                Issue Description
                            </Label>
                            <Textarea
                                id={field.name}
                                name={field.name}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                                placeholder="Describe the bug you're facing in detail..."
                                className={`min-h-[120px] resize-none bg-background/50 focus-visible:ring-primary/50 ${field.state.meta.errors.length ? 'border-destructive focus-visible:ring-destructive/50' : ''}`}
                            />
                            {field.state.meta.errors ? (
                                <em className="text-destructive text-xs font-medium" role="alert">{field.state.meta.errors.join(', ')}</em>
                            ) : null}
                        </div>
                    )}
                />

                <form.Subscribe
                    selector={(state) => [state.canSubmit, state.isSubmitting]}
                    children={([canSubmit, defaultIsSubmitting]) => (
                        <Button
                            type="submit"
                            disabled={!canSubmit || !file || isSubmitting}
                            className="w-full h-12 rounded text-md font-semibold mt-4 shadow-[0_0_20px_rgba(135,174,115,0.2)] hover:shadow-[0_0_30px_rgba(135,174,115,0.4)] transition-all"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 text-primary-foreground animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <ImagePlus className="mr-2 h-5 w-5" />
                                    Submit for Agent Prompt
                                </>
                            )}
                        </Button>
                    )}
                />
            </form>
        </div>
    );
}
