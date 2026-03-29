import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { message: "Course ID is missing" },
        { status: 400 },
      );
    }
    const token = req.cookies.get("token") || "";
    if (!token) throw new Error("Token not found");
    const cookieHeader = req.headers.get("cookie");
    const formData = await req.formData();

    const res = await fetch(
      `${process.env.BACKEND_URL}/api/v1/courses/upload-thumbnail/${id}`,
      {
        method: "POST",
        headers: {
          Cookie: cookieHeader || "",
        },
        credentials: "include",
        body: formData,
      },
    );

    const raw = await res.text();
    let data: any;

    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = {
        message: raw || "Upload failed",
        error: raw || "Upload failed",
      };
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
