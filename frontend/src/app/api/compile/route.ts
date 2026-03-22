import { NextRequest, NextResponse } from "next/server";
import axiosInstance from "@/lib/axios";

export async function POST(req: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_URL;
    const data = await req.json();

    if (!backendUrl) {
      return NextResponse.json(
        { error: "Backend URL not configured" },
        { status: 500 },
      );
    }

    const cookieHeader = req.headers.get("cookie");
    const response = await axiosInstance.post(
      `${backendUrl}/api/v1/code/compile`,
      data,
      {
        headers: {
          Cookie: cookieHeader || "",
        },
        withCredentials: true,
      }
    );

    return NextResponse.json(response.data?.data ?? response.data, { status: 200 });
  } catch (error: any) {
    const status = error?.response?.status || 500;
    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error?.message ||
      "Failed to compile code";

    return NextResponse.json(
      { error: message },
      { status },
    );
  }
}
