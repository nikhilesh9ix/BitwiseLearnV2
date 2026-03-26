import axiosInstance from "@/lib/axios";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const courses = body.courses;
    const token = req.cookies.get("token") || "";
    if (!token) throw new Error("Token not found");
    const cookieHeader = req.headers.get("cookie");

    console.log(body);
    for (let i = 0; i < courses.length; i++) {
      await axiosInstance.post(
        `${process.env.BACKEND_URL}/api/v1/courses/add-course-enrollment/`,
        {
          batchId: body.batchId,
          courseId: courses[i],
        },
        {
          headers: {
            "Content-Type": "application/json",
            Cookie: cookieHeader || "",
          },
          withCredentials: true,
        },
      );
    }
    return NextResponse.json("courses set successfully", {
      status: 200,
    });
  } catch (error: any) {
    console.error("Create section error:", error);

    return NextResponse.json(
      {
        message: error.response?.data?.message || error.message || "",
      },
      {
        status: error.response?.status || 500,
      },
    );
  }
}
