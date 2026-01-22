import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar/Sidebar";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zizzy | Student & Developer AI",
  description: "Your AI-powered full-stack coding assistant.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
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
