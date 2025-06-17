import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { usersTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }
    // Check if user already exists
    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));
    if (existing.length > 0) {
      return NextResponse.json(
        { message: "Email already in use" },
        { status: 409 },
      );
    }
    // Hash password securely
    const hashedPassword = await bcrypt.hash(password, 10);
    await db
      .insert(usersTable)
      .values({ name, email, password: hashedPassword });
    return NextResponse.json({ message: "User created" }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { message: e.message || "Server error" },
      { status: 500 },
    );
  }
}
