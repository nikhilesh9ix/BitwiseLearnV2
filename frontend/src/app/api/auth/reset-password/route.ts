import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

function getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch(
      `${process.env.BACKEND_URL}/api/v1/auth/reset-password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: req.headers.get("cookie") ?? "",
        },
        body: JSON.stringify(body),
      },
    );

    const data = await res.json();
    const cookieStore = await cookies();
    const authCookies = res.headers.getSetCookie?.() ?? [];

    for (const cookie of authCookies) {
      const [nameValue] = cookie.split(";");
      const [name, ...valueParts] = nameValue.split("=");
      const value = valueParts.join("=");
      if (!name || !value) {
        continue;
      }

      if (name === "token") {
        cookieStore.set("token", value, {
          ...getCookieOptions(),
          maxAge: 60 * 60 * 24,
        });
      }

      if (name === "refreshToken") {
        cookieStore.set("refreshToken", value, {
          ...getCookieOptions(),
          maxAge: 60 * 60 * 24 * 20,
        });
      }
    }

    cookieStore.delete("reset_token");

    return NextResponse.json(data, { status: res.status });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Request failed";
    return NextResponse.json({ message }, { status: 500 });
  }
}
