import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { message: "Content ID is Missing" },
        { status: 400 },
      );
    }

    const cookieHeader = req.headers.get("cookie");
    const authHeader = req.headers.get("authorization");
    const formData = await req.formData();

    const res = await fetch(
      `${process.env.BACKEND_URL}/api/v1/courses/upload-file-in-content/${id}`,
      {
        method: "POST",
        headers: {
          Cookie: cookieHeader || "",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        credentials: "include",
        body: formData,
      },
    );

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
