import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export const getAssessmentById = async (assessmentId: string) => {
  try {
    const res = await axiosInstance.get(
      `/api/v1/assessments/get-assessment-by-id/${assessmentId}`,
    );

    return res.data;
  } catch (error: any) {
    toast.error(
      error?.response?.data?.error ||
        error?.response?.data?.message ||
        "error getting assessments",
    );
    throw error;
  }
};
