import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar/Sidebar";
import { Providers } from "./providers";
import Script from "next/script"; // 1. Import the Script component

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zizzy",
  description: "Your AI-powered chatbot / full-stack coding assistant.",
  icons: [
    { rel: "icon", url: "/logo.png", media: "(prefers-color-scheme: dark)" },
    { rel: "icon", url: "/zizzy-light.png", media: "(prefers-color-scheme: light)" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Use a standard script tag for verification to ensure it's in the raw HTML */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7464972307118819"
          crossOrigin="anonymous"
        ></script>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} flex h-screen overflow-hidden bg-[var(--background)]`} suppressHydrationWarning>
        <div className="flex w-full h-full">
          <Providers>
            <Sidebar />
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
              {children}
            </main>
          </Providers>
        </div>
      </body>
    </html>
  );
}
