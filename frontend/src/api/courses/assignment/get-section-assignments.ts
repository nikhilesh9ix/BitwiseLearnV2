import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export const getAssignmentsBySection = async (
  sectionId: string,
  stateFn?: any,
) => {
  try {
    const res = await axiosInstance.get(
      `/api/v1/courses/get-all-section-assignments/${sectionId}`,
    );

    if (stateFn) {
      stateFn(res.data);
    }

    return res.data;
  } catch (error: any) {
    toast.error(error.message || "failed to get section");
  }
};
