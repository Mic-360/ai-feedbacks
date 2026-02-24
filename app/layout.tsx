import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ai-feedbacks.example.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AI Feedbacks | Transform Bugs into AI Prompts",
    template: "%s | AI Feedbacks",
  },
  description: "Upload your UI error or issue screenshot, and let Gemini construct the perfect prompt for a coding agent to fix it instantly.",
  keywords: ["AI", "Feedback", "Debugging", "Gemini", "Coding Agent", "Developer Tools", "Prompt Engineering"],
  authors: [{ name: "bhaumic", url: siteUrl }],
  creator: "bhaumic",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    title: "AI Feedbacks | Transform Bugs into AI Prompts",
    description: "Upload your UI error or issue screenshot, and let Gemini construct the perfect prompt for a coding agent to fix it instantly.",
    siteName: "AI Feedbacks",
    images: [
      {
        url: "/image.png",
        width: 1200,
        height: 630,
        alt: "AI Feedbacks OG Image",
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Feedbacks | Transform Bugs into AI Prompts",
    description: "Upload your UI error or issue screenshot, and let Gemini construct the perfect prompt for a coding agent to fix it instantly.",
    creator: "@bhaumic",
    images: ["/image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/30">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "AI Feedbacks",
              "description": "Transform UI bugs and errors into highly optimized prompts for coding agents using Gemini 3.",
              "url": siteUrl,
              "applicationCategory": "DeveloperApplication",
              "operatingSystem": "All",
              "author": {
                "@type": "Person",
                "name": "bhaumic",
              },
            })
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="fixed inset-0 z-[-1] bg-background bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(135,174,115,0.15),rgba(255,255,255,0))]" />
          <Navbar />
          <main className="flex-1 flex flex-col relative w-full">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
