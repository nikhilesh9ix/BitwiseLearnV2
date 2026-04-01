import { NextResponse, NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ institutionId: string; id: string }> },
) {
  try {
    const { id, institutionId } = await context.params;
    const cookieHeader = req.headers.get("cookie");
    const authHeader = req.headers.get("authorization");
    const res = await fetch(
      `${process.env.BACKEND_URL}/api/v1/courses/get-course-enrollments/${id}`,
      {
        headers: {
          Cookie: cookieHeader || "",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        credentials: "include",
      },
    );

    const data = await res.json();
    const enrollments = Array.isArray(data?.data?.data) ? data.data.data : [];
    const filtered = enrollments.filter((enrollment: any) => {
      const institution = enrollment?.institution;
      return (
        institution?.id === institutionId ||
        enrollment?.institution_id === institutionId
      );
    });

    const responseResult = {
      data: {
        course: data?.data?.course ?? {},
        data: filtered,
      },
    };
    return NextResponse.json(responseResult.data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
