"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SubjectSwitcher } from "./SubjectSwitcher";
import { UserMenu } from "./UserMenu";
import { ThemeToggleSwitch } from "../../theme/ThemeToggleSwitch";
import { Logo } from "../Logo";

interface MobileNavProps {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export function MobileNav({ name, email, image }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="bg-white/10 backdrop-blur-md border border-white/20 text-foreground hover:bg-white/20 hover:border-white/30 transition-all duration-300 shadow-lg"
        >
          <Menu className="h-4 w-4" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[300px] bg-background/95 backdrop-blur-md"
      >
        <SheetHeader>
          <SheetTitle>
            <Logo />
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-6 mt-6 p-4">
          {/* Subject Switcher */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Subject
            </h3>
            <SubjectSwitcher className="w-full" />
          </div>

          {/* Theme Toggle */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Theme</h3>
            <div className="flex justify-start">
              <ThemeToggleSwitch />
            </div>
          </div>

          {/* User Menu */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Account
            </h3>
            <UserMenu name={name} email={email} image={image} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
