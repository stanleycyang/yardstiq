import type { Metadata } from "next";
import { JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "yardstiq — Compare AI Models Side-by-Side in Your Terminal",
  description:
    "One prompt, multiple models, real-time streaming, performance stats, and an AI judge — all in a single command. Compare Claude, GPT, Gemini, Llama, and 40+ more.",
  keywords: [
    "LLM comparison",
    "AI benchmark",
    "CLI tool",
    "model comparison",
    "Claude",
    "GPT",
    "Gemini",
    "terminal",
    "developer tools",
  ],
  openGraph: {
    title: "yardstiq — Compare AI Models Side-by-Side",
    description:
      "One prompt, multiple models, real-time streaming. Compare 40+ AI models in your terminal.",
    url: "https://yardstiq.dev",
    siteName: "yardstiq",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "yardstiq — Compare AI Models Side-by-Side",
    description:
      "One prompt, multiple models, real-time streaming. Compare 40+ AI models in your terminal.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-zinc-950 text-zinc-100`}
      >
        {children}
      </body>
    </html>
  );
}
