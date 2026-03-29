import { NextRequest, NextResponse } from "next/server";
import axiosInstance from "@/lib/axios";

export async function POST(req: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_URL;
    const data = await req.json();
    const page = Math.max(1, Number(data.pageNumber ?? 0) + 1);
    const limit = 1000;

    if (!backendUrl) {
      return NextResponse.json(
        { error: "Backend URL not configured" },
        { status: 500 },
      );
    }
    const token = req.cookies.get("token") || "";
    if (!token) throw new Error("Token not found");
    const cookieHeader = req.headers.get("cookie");

    const response = await axiosInstance.get(
      `${backendUrl}/api/v1/reports/course-report/${data.batchId}/${data.courseId}?page=${page}&limit=${limit}`,
      {
        headers: {
          Cookie: cookieHeader || "",
        },
        withCredentials: true,
      },
    );

    return NextResponse.json(response.data.data, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching institutions:", error.message);

    return NextResponse.json(
      { error: "Failed to fetch report" },
      { status: 500 },
    );
  }
}
