import type { Metadata } from "next";
import { Sora, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { auth } from "@/auth";
import { Toaster } from "sonner";
import AuthProvider from "@/components/auth/AuthProvider";
import { TRPCProvider } from "@/trpc/client";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const sora = Sora({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-sora",
  display: "swap",
});

const sourceSans3 = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-source-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://domain"),
  title: {
    default: "Auth",
    template: `%s | Auth`,
  },
  description: "Description",
  keywords: [],
  icons: {
    icon: "/icon.png",
  },
  openGraph: {
    title: "Auth",
    description: "Description",
    images: [""],
    url: "https://domain",
    siteName: "Auth",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <AuthProvider session={session}>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${sora.variable} ${sourceSans3.variable} antialiased min-h-screen flex flex-col relative overflow-x-hidden`}
        >
          {/* Aurora Background */}
          <div className="fixed inset-0 -z-10 overflow-hidden">
            {/* Primary aurora orbs with enhanced visibility for light mode */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-500/25 to-cyan-400/15 dark:from-blue-500/15 dark:to-cyan-400/8 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-purple-500/20 to-indigo-400/12 dark:from-purple-500/12 dark:to-indigo-400/6 rounded-full blur-3xl animate-pulse delay-1000" />
            <div className="absolute top-3/4 left-3/4 w-64 h-64 bg-gradient-to-br from-teal-400/18 to-cyan-300/10 dark:from-teal-400/10 dark:to-cyan-300/5 rounded-full blur-3xl animate-pulse delay-2000" />

            {/* Secondary accent orbs */}
            <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-gradient-to-br from-sky-300/15 to-blue-400/8 dark:from-sky-300/8 dark:to-blue-400/4 rounded-full blur-2xl animate-pulse delay-3000" />
            <div className="absolute top-1/6 right-1/6 w-48 h-48 bg-gradient-to-br from-indigo-400/18 to-purple-300/10 dark:from-indigo-400/10 dark:to-purple-300/5 rounded-full blur-3xl animate-pulse delay-4000" />

            {/* Subtle grid pattern with better visibility */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.04)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

            {/* Layered gradients for depth - enhanced for light mode */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.15),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.08),transparent)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_80%_20%,rgba(147,51,234,0.12),transparent)] dark:bg-[radial-gradient(ellipse_60%_80%_at_80%_20%,rgba(147,51,234,0.06),transparent)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_60%_at_20%_80%,rgba(6,182,212,0.08),transparent)] dark:bg-[radial-gradient(ellipse_40%_60%_at_20%_80%,rgba(6,182,212,0.04),transparent)]" />
          </div>

          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <TRPCProvider>
              <main className="relative z-10">{children}</main>
              <Toaster richColors closeButton />
            </TRPCProvider>
          </ThemeProvider>
        </body>
      </html>
    </AuthProvider>
  );
}
