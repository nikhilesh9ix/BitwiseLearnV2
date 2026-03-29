import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export async function getStudentData(
  pageNumber: number,
  courseId: string,
  batchId: string,
  setStudentData: (data: any) => void,
) {
  try {
    const response = await axiosInstance.post("/api/reports/course-report/", {
      courseId,
      batchId,
      pageNumber,
    });
    const payload = response.data;
    setStudentData(Array.isArray(payload?.students) ? payload.students : []);

    return payload?.totalCourseTopics ?? 0;
  } catch (error) {
    toast.error("Failed to load course report");
    setStudentData([]);
  }
}
