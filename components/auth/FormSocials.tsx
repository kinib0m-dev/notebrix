"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import GoogleLogo from "@/public/icons/google.svg";
import GithubLogo from "@/public/icons/github.svg";
import { DEFAULT_LOGIN_REDIRECT } from "@/lib/auth/routes/routes";

export function FormSocials() {
  const onClick = (provider: "google" | "github") => {
    signIn(provider, {
      callbackUrl: DEFAULT_LOGIN_REDIRECT,
    });
  };
  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <Button
        size="lg"
        className="w-full cursor-pointer"
        variant="outline"
        onClick={() => onClick("google")}
      >
        <Image src={GoogleLogo} alt="Google logo" className="size-5 mr-2" />
        Sign In with Google
      </Button>
      <Button
        size="lg"
        className="w-full cursor-pointer"
        variant="outline"
        onClick={() => onClick("github")}
      >
        <Image
          src={GithubLogo}
          alt="Github logo"
          className="size-6 mr-2 p-1 rounded-full bg-white"
        />
        Sign In with Github
      </Button>
    </div>
  );
}
