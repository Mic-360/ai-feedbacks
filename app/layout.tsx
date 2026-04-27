import type { Metadata } from "next";
import { Fraunces, Newsreader, Mona_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ThemeProvider } from "@/components/theme-provider";
import { ChatLauncher } from "@/components/chat/ChatLauncher";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["SOFT", "opsz"],
});

const newsreader = Newsreader({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
});

const monaSans = Mona_Sans({
  variable: "--font-ui",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const jetMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ai-feedbacks.example.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AI Feedbacks | Automated Bug-Report Processing",
    template: "%s | AI Feedbacks",
  },
  description: "A centralized command center for incoming feedback. Process user reports into actionable AI tasks.",
  keywords: ["AI", "Feedback", "Debugging", "Gemini", "Coding Agent", "Developer Tools", "Prompt Engineering"],
  authors: [{ name: "bhaumic", url: siteUrl }],
  creator: "bhaumic",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    title: "AI Feedbacks | Automated Bug-Report Processing",
    description: "A centralized command center for incoming feedback.",
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
    title: "AI Feedbacks | Automated Bug-Report Processing",
    description: "A centralized command center for incoming feedback.",
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
    <html
      lang="en"
      className={`${fraunces.variable} ${newsreader.variable} ${monaSans.variable} ${jetMono.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased min-h-screen flex flex-col bg-(--paper) text-(--ink) selection:bg-(--ink) selection:text-(--paper)">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "AI Feedbacks",
              "description": "A centralized command center for incoming feedback.",
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
          <Navbar />
          <main className="flex-1 flex flex-col relative w-full">
            {children}
          </main>
          <Footer />
          <ChatLauncher />
        </ThemeProvider>
      </body>
    </html>
  );
}
