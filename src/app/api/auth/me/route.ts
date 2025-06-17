import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth-client";

export async function GET(req: NextRequest) {
  // Get the JWT from the cookie
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  // Verify the JWT
  const user = verifyJwt(token);
  if (!user) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
  // Return user info (never return sensitive info)
  return NextResponse.json({ user });
}
