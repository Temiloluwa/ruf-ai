import { NextResponse } from "next/server";

export async function POST() {
  console.log("Sign-out attempt");
  // Clear the JWT cookie
  const response = NextResponse.json(
    { message: "Signed out" },
    { status: 200 },
  );
  response.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
  return response;
}
