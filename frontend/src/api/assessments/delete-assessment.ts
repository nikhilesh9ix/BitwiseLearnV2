import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export const deleteAssessment = async (assessmentId: string) => {
  try {
    if (!assessmentId) {
      throw new Error("Assessment ID is required");
    }

    const res = await axiosInstance.delete(
      `/api/v1/assessments/delete-assessment-by-id/${assessmentId}`,
    );
    return res.data.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Error deleting assessment";

    toast.error(message);
    throw error;
  }
};
