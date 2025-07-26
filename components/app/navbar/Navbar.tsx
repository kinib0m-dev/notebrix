"use client";

import { Logo } from "@/components/app/Logo";
import { SubjectSwitcher } from "./SubjectSwitcher";
import { UserMenu } from "./UserMenu";
import { MobileNav } from "./MobileNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { ThemeToggleSwitch } from "../../theme/ThemeToggleSwitch";

interface NavbarProps {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export function Navbar({ name, email, image }: NavbarProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <nav className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Logo />
            </div>

            {/* Mobile Navigation */}
            <MobileNav name={name} email={email} image={image} />
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Logo />
          </div>

          {/* Subject Switcher - Center */}
          <div className="flex-1 flex justify-center">
            <SubjectSwitcher />
          </div>

          {/* Right Side - Theme Toggle & User Menu */}
          <div className="flex items-center gap-3">
            <ThemeToggleSwitch />
            <UserMenu name={name} email={email} image={image} />
          </div>
        </div>
      </div>
    </nav>
  );
}
