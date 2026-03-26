import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export async function enrollInstitutionCourses(data: {
  batchId: string;
  courses: string[];
}) {
  try {
    if (!data.batchId || !Array.isArray(data.courses) || data.courses.length === 0) {
      throw new Error("Batch and at least one course are required");
    }

    const results = await Promise.allSettled(
      data.courses.map((courseId) =>
        axiosInstance.post("/api/v1/courses/add-course-enrollment/", {
          batchId: data.batchId,
          courseId,
        }),
      ),
    );

    const failed = results.filter((result) => result.status === "rejected");

    if (failed.length === results.length) {
      const firstError = (failed[0] as PromiseRejectedResult).reason;
      throw firstError;
    }

    if (failed.length > 0) {
      toast.success(`${results.length - failed.length} enrolled, ${failed.length} failed`);
      return;
    }

    toast.success("Enrolled successfully");
  } catch (error: any) {
    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error?.message ||
      "Failed to enroll";
    toast.error(message);
    throw error;
  }
}
