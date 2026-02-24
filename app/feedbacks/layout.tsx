import { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ai-feedbacks.example.com";

export const metadata: Metadata = {
    title: 'Explore Community Feedbacks | AI Feedbacks',
    description: 'Search and explore actionable AI prompts generated from real community UI issues and bugs using Gemini 3 Flash.',
    openGraph: {
        title: 'Explore Community Feedbacks | AI Feedbacks',
        description: 'Search and explore actionable AI prompts generated from real community UI issues and bugs using Gemini 3 Flash.',
        url: `${siteUrl}/feedbacks`,
        images: [{ url: '/image.png', width: 1200, height: 630 }],
    },
    twitter: {
        title: 'Explore Community Feedbacks | AI Feedbacks',
        description: 'Search and explore actionable AI prompts generated from real community UI issues and bugs using Gemini 3 Flash.',
        images: ['/image.png'],
    },
};

export default function FeedbacksLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
