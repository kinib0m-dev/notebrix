"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FormSocials } from "./FormSocials";
import { Logo } from "../app/Logo";

interface FormWrapperProps {
  children: React.ReactNode;
  label: string;
  buttonHref: string;
  buttonLabel: string;
  showSocials?: boolean;
  headerTitle?: string;
}

export function FormWrapper({
  children,
  label,
  buttonHref,
  buttonLabel,
  showSocials = false,
  headerTitle,
}: FormWrapperProps) {
  return (
    <Card className="w-full max-w-md mx-auto relative z-20">
      <CardHeader className="space-y-4 pb-8">
        <div className="flex flex-col items-center space-y-4">
          <Logo />

          {/* Header text */}
          <div className="text-center space-y-2">
            {headerTitle && (
              <h1 className="text-2xl font-semibold text-foreground">
                {headerTitle}
              </h1>
            )}
            <p className="text-muted-foreground text-sm leading-relaxed">
              {label}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-6 relative z-20">
        {showSocials && (
          <div className="space-y-4 mb-6">
            <FormSocials />
            <div className="relative flex items-center justify-center text-xs uppercase">
              <span className="flex items-center w-full">
                <span className="flex-1 border-t border-border mr-2" />
                <span className="px-2 text-muted-foreground font-medium whitespace-nowrap">
                  or continue with email
                </span>
                <span className="flex-1 border-t border-border ml-2" />
              </span>
            </div>
          </div>
        )}
        {children}
      </CardContent>

      <CardFooter className="pt-0 relative z-30">
        <div className="w-full text-center">
          <span className="text-sm text-muted-foreground">{buttonLabel} </span>
          <Button
            variant="link"
            className="p-0 h-auto text-primary hover:text-primary/80 font-medium underline-offset-4 relative z-30"
            asChild
          >
            <Link href={buttonHref} className="relative z-30">
              {buttonHref === "/login" ? "Sign in" : "Sign up"}
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
