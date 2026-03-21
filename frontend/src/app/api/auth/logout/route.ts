import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });

  const cookiesToClear = [
    "token",
    "refreshToken",
    "role",
    "reset_token",
  ];

  cookiesToClear.forEach((name) => {
    response.cookies.set(name, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: new Date(0),
    });
  });

  return response;
}
