"use client";
import { Card, CardContent } from "@/components/ui/card";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { OctagonAlertIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSignIn } from "./clerk-hooks";
import type { OAuthStrategy } from "@clerk/types";

const formSchema = z.object({
  identifier: z.string().min(2, {
    message: "Email or username is required",
  }),
  password: z.string().min(2, {
    message: "Password is required",
  }),
});

function isClerkError(err: unknown): err is { errors: { message: string }[] } {
  if (typeof err !== "object" || err === null) return false;
  const maybe = err as Record<string, unknown>;
  return (
    Array.isArray(maybe.errors) && typeof maybe.errors[0]?.message === "string"
  );
}

export const SignIn = () => {
  const router = useRouter();
  const signInCtx = useSignIn();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<{
    identifier: string;
    password: string;
  }>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setError(null);
    setPending(true);
    try {
      if (!signInCtx || !signInCtx.signIn) throw new Error("Sign in not ready");
      const result = await signInCtx.signIn.create({
        identifier: data.identifier,
        password: data.password,
      });
      if (result.status === "complete") {
        router.push("/");
      } else if (result.status === "needs_first_factor") {
        setError("Additional authentication required.");
      } else {
        setError("Sign in failed.");
      }
    } catch (err: unknown) {
      let message = "Sign in failed";
      if (isClerkError(err)) {
        message = err.errors[0].message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
    } finally {
      setPending(false);
    }
  };

  // Handler for social login
  const handleSocialSignIn = async (provider: "google" | "github") => {
    setPending(true);
    setError(null);
    try {
      if (!signInCtx || !signInCtx.signIn) throw new Error("Sign in not ready");
      const strategy =
        provider === "google"
          ? ("oauth_google" as OAuthStrategy)
          : ("oauth_github" as OAuthStrategy);
      await signInCtx.signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: "/",
        redirectUrlComplete: "/",
      });
    } catch (err: unknown) {
      setError("Social sign in failed");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 md:p-8">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center text-center">
                  <h1 className="text-2xl font-bold">Welcome back</h1>
                  <p className="text-muted-foreground text-balance">
                    Login to your account
                  </p>
                </div>
                <div className="grid gap-3">
                  <FormField
                    control={form.control}
                    name="identifier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email or Username</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Email or username"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-3">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="*******"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {!!error && (
                  <Alert className="bg-destructive/10 border-none">
                    <OctagonAlertIcon className="h-4 w-4 !text-destructive" />
                    <AlertTitle>{error}</AlertTitle>
                  </Alert>
                )}
                <Button disabled={pending} type="submit" className="w-full">
                  Sign in
                </Button>
                <div
                  className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0
                                after:flex after:items-center after:border-t"
                >
                  <span className="bg-card text-muted-foreground relative z-10 px-2">
                    Or continue with
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    disabled={pending}
                    variant="outline"
                    className="w-full"
                    type="button"
                    onClick={() => handleSocialSignIn("google")}
                  >
                    Google
                  </Button>
                  <Button
                    disabled={pending}
                    variant="outline"
                    className="w-full"
                    type="button"
                    onClick={() => handleSocialSignIn("github")}
                  >
                    Github
                  </Button>
                </div>
                <div className="text-center text-sm">
                  <p className="text-muted-foreground">
                    Don&apos;t have an account?{" "}
                    <Link
                      className="underline underline-offset-4"
                      href={"/sign-up"}
                    >
                      Sign up
                    </Link>
                  </p>
                </div>
              </div>
            </form>
          </Form>

          <div className="bg-radial from-[#007AFF] to-[#312ECB] relative hidden md:flex flex-col gap-y-4 items-center justify-center">
            <img
              src="/logo.svg"
              alt="ruf.ai logo"
              className="h-[92px] w-[92px]"
            />
            <p className="text-2xl font-semibold text-white">Ruf.AI</p>
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our{" "}
        <Link href={"/terms"}>Terms of Service</Link> and{" "}
        <Link href={"/privacy"}>Privacy Policy</Link>.
      </div>
    </div>
  );
};
