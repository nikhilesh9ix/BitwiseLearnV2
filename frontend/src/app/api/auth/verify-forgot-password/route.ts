import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch(
      `${process.env.BACKEND_URL}/api/v1/auth/verify-forgot-password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        credentials: "include",
      },
    );

    const data = await res.json();
    const resetToken =
      data?.data?.reset_token ?? data?.data?.resetToken ?? null;

    if (resetToken) {
      (await cookies()).set("reset_token", resetToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 10,
      });
    }

    return NextResponse.json(
      {
        ...data,
        data: {
          ...data?.data,
          resetToken,
        },
      },
      { status: res.status },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Request failed";
    return NextResponse.json({ message }, { status: 500 });
  }
}
