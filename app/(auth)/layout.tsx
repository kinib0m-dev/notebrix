import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Auth",
  description: "Auth Page",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Home button - top left with glass effect */}
      <div className="relative z-20 p-6">
        <Button
          variant="outline"
          size="sm"
          className="bg-white/10 backdrop-blur-md border border-white/20 text-foreground hover:bg-white/20 hover:border-white/30 transition-all duration-300 shadow-lg"
          asChild
        >
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Home
          </Link>
        </Button>
      </div>

      {/* Main content - grows to fill space */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">{children}</div>
      </div>

      {/* Bottom legal text - always at bottom with glass effect */}
      <div className="relative z-20 pb-8 px-4 p-4">
        <div className="text-center">
          <p className="text-xs text-muted-foreground/80 max-w-md mx-auto">
            By signing in, you agree to our{" "}
            <Link
              href="/terms"
              className="underline underline-offset-2 hover:text-primary transition-colors"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="underline underline-offset-2 hover:text-primary transition-colors"
            >
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
