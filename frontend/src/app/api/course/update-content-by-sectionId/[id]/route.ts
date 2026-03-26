import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const data = await req.json();
    const token = req.cookies.get("token") || "";
    if (!token) throw new Error("Token not found");
    const cookieHeader = req.headers.get("cookie");

    const res = await fetch(
      `${process.env.BACKEND_URL}/api/v1/courses/update-content-to-section/${id}`,
      {
        method: "PUT",
        headers: {
          Cookie: cookieHeader || "",
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      },
    );
    // return NextResponse.json(res.json(),{status:res.status})
    const responseData = await res.json();
    return NextResponse.json(responseData, { status: res.status });
  } catch (error: any) {
    console.log(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
