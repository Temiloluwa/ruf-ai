"use client";
import { useAuth } from "../components/auth-context";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function HomeAuthStatus() {
  const { isSignedIn, signOut } = useAuth();
  const router = useRouter();

  if (typeof window !== "undefined" && !isSignedIn) {
    window.location.replace("/sign-in");
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <h1 className="text-2xl font-bold">You are signed in!</h1>
      <Button onClick={signOut}>Sign out</Button>
    </div>
  );
}
