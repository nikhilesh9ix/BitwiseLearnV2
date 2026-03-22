import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export const getStudentAssignmentsBySection = async (
  sectionId: string,
  stateFn?: any,
) => {
  try {
    const res = await axiosInstance.get(
      `/api/v1/courses/get-student-section-assignments/${sectionId}`,
    );

    if (stateFn) {
      stateFn(res.data.data);
    }
    // console.log(res.data);
    return res.data;
  } catch (error: any) {
    toast.error(error.message || "failed to get section");
  }
};
