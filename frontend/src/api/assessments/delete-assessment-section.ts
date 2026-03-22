import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export const deleteAssessmentSection = async (sectionId: string) => {
  try {
    const res = await axiosInstance.delete(
      `/api/v1/assessments/delete-assessment-section/${sectionId}`,
    );
    return res.data.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Error deleting section";
    toast.error(message);
    throw error;
  }
};
