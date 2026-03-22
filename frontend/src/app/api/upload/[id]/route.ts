import { NextRequest, NextResponse } from "next/server";
const URL_MAP: Record<string, string> = {
  STUDENT: "students",
  BATCH: "batches",
  TESTCASE: "testcases",
  ASSESSMENT: "assessment",
  ASSIGNMENT: "assignment",
};
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    const formData = await req.formData();
    const uploadType = String(formData.get("type") || "");
    const mappedPath = URL_MAP[uploadType];
    if (!mappedPath) {
      return NextResponse.json(
        { message: `Unsupported upload type: ${uploadType}` },
        { status: 400 },
      );
    }

    const cookieHeader = req.headers.get("cookie");
    const authHeader = req.headers.get("authorization");

    const res = await fetch(
      `${process.env.BACKEND_URL}/api/v1/bulk-upload/${mappedPath}/${id}`,
      {
        method: "POST",
        headers: {
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        credentials: "include",
        body: formData,
      },
    );

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
