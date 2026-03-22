import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export const getAssessmentSections = async (assessmentId: string) => {
  try {
    if (!assessmentId) return [];

    const res = await axiosInstance.get(
      `/api/v1/assessments/get-sections-for-assessment/${assessmentId}`,
    );

    return res.data?.data ?? [];
  } catch (error: any) {
    toast.error(
      error?.response?.data?.error ||
        error?.response?.data?.message ||
        "error getting sections",
    );
    return [];
  }
};
