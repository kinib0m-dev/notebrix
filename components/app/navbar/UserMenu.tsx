"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, LogOut, ChevronDown } from "lucide-react";
import { logOut } from "@/lib/auth/auth.actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type UserMenuProps = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export function UserMenu({ name, email, image }: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="bg-white/10 backdrop-blur-md border border-white/20 text-foreground hover:bg-white/20 hover:border-white/30 transition-all duration-300 shadow-lg h-10 px-3"
        >
          <Avatar className="h-6 w-6 mr-2">
            {image ? (
              <AvatarImage src={image} alt={name || ""} />
            ) : (
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {name?.charAt(0) || email?.charAt(0) || "U"}
              </AvatarFallback>
            )}
          </Avatar>
          <span className="hidden sm:inline-block truncate max-w-[100px]">
            {name || email}
          </span>
          <ChevronDown className="h-4 w-4 ml-1 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 bg-white/10 backdrop-blur-md border border-white/20 shadow-xl"
        align="end"
        forceMount
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/20" />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="hover:bg-white/10">
            <Link href="/settings">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-white/20" />
        <form
          action={async () => {
            await logOut();
          }}
        >
          <DropdownMenuItem asChild className="hover:bg-white/10">
            <button type="submit" className="w-full cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
