"use client";
import { useUser, SignOutButton } from "@clerk/nextjs";

export function HomeAuthStatus() {
  const { isSignedIn } = useUser();

  if (typeof window !== "undefined" && !isSignedIn) {
    window.location.replace("/sign-in");
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <h1 className="text-2xl font-bold">You are signed in!</h1>
      <SignOutButton />
    </div>
  );
}
