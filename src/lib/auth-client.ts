// src/lib/auth-client.ts
// Auth client for sign-up and sign-in views
import jwt from "jsonwebtoken";

type AuthResponse = {
  onSuccess: () => void;
  onError: (params: { error: Error }) => void;
};

export const authClient = {
  signUp: {
    email: async (
      params: { name: string; email: string; password: string },
      handlers: AuthResponse,
    ) => {
      try {
        // Replace with your actual API endpoint
        const res = await fetch("/api/auth/sign-up", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || "Sign up failed");
        }
        handlers.onSuccess();
      } catch (error: any) {
        handlers.onError({ error });
      }
    },
  },
};

export function signJwt(payload: object, options?: jwt.SignOptions) {
  return jwt.sign(payload, process.env.JWT_SECRET || "secret-key", options);
}

export function verifyJwt(token: string) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || "secret-key");
  } catch {
    return null;
  }
}
