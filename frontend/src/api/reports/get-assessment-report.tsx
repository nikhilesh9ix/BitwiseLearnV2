// /assessment-report/:assessmentId/
import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export async function getStudentData(
  assessmentId: string,
  pageNumber: number,
  setStudentData: (data: any) => void,
) {
  try {
    const response = await axiosInstance.post("/api/reports/assessment-report/", {
      assessmentId,
      pageNumber,
    });
    const payload = response.data;
    setStudentData(Array.isArray(payload?.submissions) ? payload.submissions : []);
  } catch (error) {
    toast.error("Failed to load assessment report");
    setStudentData([]);
  }
}
