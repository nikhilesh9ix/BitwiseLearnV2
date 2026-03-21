import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

interface LoginProp {
  email: string;
  password: string;
  role: "STUDENT" | "INSTITUTION" | "ADMIN" | "VENDOR" | "TEACHER";
}
const URL_MAP = {
  STUDENT: "/student/login",
  INSTITUTION: "/institution/login",
  ADMIN: "/admin/login",
  VENDOR: "/vendor/login",
  TEACHER: "/teacher/login",
};

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
    const backendUrl = process.env.BACKEND_URL;
    const data: LoginProp = await req.json();

    if (!backendUrl) {
      return NextResponse.json(
        { error: "Backend URL not configured" },
        { status: 500 },
      );
    }
    console.log(backendUrl);
    const response = await axios.post(
      `${backendUrl}/api/v1/auth` + URL_MAP[data.role],
      { email: data.email, password: data.password },
    );
    const payload = response.data?.data ?? {};
    const tokens = payload.tokens ?? {};
    const normalizedTokens = {
      accessToken: tokens.access_token ?? tokens.accessToken ?? null,
      refreshToken: tokens.refresh_token ?? tokens.refreshToken ?? null,
    };

    const nextResponse = NextResponse.json(
      {
        ...payload,
        tokens: normalizedTokens,
      },
      { status: 200 },
    );

    if (normalizedTokens.accessToken) {
      nextResponse.cookies.set("token", normalizedTokens.accessToken, {
        ...getCookieOptions(),
        maxAge: 60 * 60 * 24,
      });
    }
    if (normalizedTokens.refreshToken) {
      nextResponse.cookies.set("refreshToken", normalizedTokens.refreshToken, {
        ...getCookieOptions(),
        maxAge: 60 * 60 * 24 * 20,
      });
    }

    return nextResponse;
  } catch (error: unknown) {
    const statusCode = axios.isAxiosError(error)
      ? (error.response?.status ?? 500)
      : 500;
    const backendMessage = axios.isAxiosError(error)
      ? ((error.response?.data as { error?: string; message?: string } | undefined)
          ?.error ||
        (error.response?.data as { error?: string; message?: string } | undefined)
          ?.message ||
        error.message)
      : "Failed loggin in";

    console.dir("Error loggin in :", backendMessage);
    return NextResponse.json({ error: backendMessage }, { status: statusCode });
  }
}
