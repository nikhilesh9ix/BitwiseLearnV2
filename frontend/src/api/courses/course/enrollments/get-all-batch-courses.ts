import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export async function allBatchCourses(batchId: string) {
  try {
    const result = await axiosInstance.get(
      "/api/v1/courses/get-course-enrollments-by-batch/" + batchId,
    );
    const enrollments = result.data?.data || [];
    const dataMap = enrollments.map((course: any) => {
      return { ...course.course, id: course.id };
    });

    return dataMap;
  } catch (error) {
    toast.error("failed to get all batches");
    return [];
  }
}
