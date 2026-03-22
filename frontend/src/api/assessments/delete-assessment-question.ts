import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export const deleteAssessmentQuestion = async (questionId: string) => {
  try {
    const res = await axiosInstance.delete(
      `/api/v1/assessments/delete-assessment-question/${questionId}`,
    );

    return res.data.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Error deleting question";
    toast.error(message);
    throw error;
  }
};
