import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { usersTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { signJwt } from "@/lib/auth-client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const { email = "", password = "" } = body || {};
    console.log("Sign-in attempt for email:", email);
    if (!email || !password) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }
    // Check if user exists
    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));
    if (users.length === 0) {
      return NextResponse.json(
        { message: "User does not exist" },
        { status: 401 },
      );
    }
    const user = users[0];
    // Secure password check
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      console.log("Sign-in failed: wrong password for email:", email);
      return NextResponse.json({ message: "Wrong password" }, { status: 401 });
    }
    // Create JWT
    const token = signJwt(
      { id: user.id, email: user.email, name: user.name },
      { expiresIn: "1h" },
    );
    console.log("JWT created for user:", user.id, token);
    console.log("Sign-in success for email:", email, "user id:", user.id);
    // Set JWT in HttpOnly, Secure cookie
    const response = NextResponse.json(
      { message: "Signed in" },
      { status: 200 },
    );
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Secure only in production
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60, // 1 hour
    });
    return response;
  } catch (e: any) {
    // Log the actual error for debugging, but do not expose to client
    console.error("Sign-in error:", e);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
