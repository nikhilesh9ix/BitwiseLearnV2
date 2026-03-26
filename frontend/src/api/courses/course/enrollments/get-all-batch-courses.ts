import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export async function allBatchCourses(batchId: string) {
  try {
    const result = await axiosInstance.get(
      "/api/v1/courses/get-course-enrollments-by-batch/" + batchId,
    );
    const enrollments = result.data?.data || [];
    const dataMap = enrollments.map((row: any) => ({
      id: row.id,
      courseId: row.courseId || row.course_id,
      name: row.courseName || row.course_name || "Unknown Course",
      instructorName: row.instructorName || row.instructor_name || "",
      level: row.level || "",
      createdAt: row.createdAt || row.created_at || row.enrolledAt || row.enrolled_at,
    }));

    return dataMap;
  } catch (error) {
    toast.error("failed to get all batches");
    return [];
  }
}
