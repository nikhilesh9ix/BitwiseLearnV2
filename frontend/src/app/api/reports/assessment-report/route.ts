import { NextRequest, NextResponse } from "next/server";
import axiosInstance from "@/lib/axios";

export async function POST(req: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_URL;
    const data = await req.json();
    const page = Math.max(1, Number(data.pageNumber ?? 0) + 1);
    const limit = Math.min(1000, Math.max(1, Number(data.limit ?? 100)));

    if (!backendUrl) {
      return NextResponse.json(
        { error: "Backend URL not configured" },
        { status: 500 },
      );
    }
    const cookieHeader = req.headers.get("cookie");
    const authHeader = req.headers.get("authorization");
    const response = await axiosInstance.get(
      `${backendUrl}/api/v1/reports/assessment-report/${data.assessmentId}?page=${page}&limit=${limit}`,
      {
        headers: {
          Cookie: cookieHeader || "",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        withCredentials: true,
      }

    );

    return NextResponse.json(response.data?.data ?? response.data, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching institutions:", message);

    return NextResponse.json(
      { error: "Failed to fetch report" },
      { status: 500 },
    );
  }
}
