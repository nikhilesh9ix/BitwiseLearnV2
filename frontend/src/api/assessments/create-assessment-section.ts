import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

type AssessmentSectionPayload = {
  name: string;
  marksPerQuestion: number;
  assessmentType: "CODE" | "NO_CODE";
  assessmentId: string;
};

export const createAssessmentSection = async (
  payload: AssessmentSectionPayload,
) => {
  try {
    const res = await axiosInstance.post(
      "/api/v1/assessments/add-assessment-section",
      payload,
    );

    return res.data.data;
  } catch (error: any) {
    toast.error(
      error?.response?.data?.error ||
        error?.response?.data?.message ||
        "error creating section",
    );
    throw error;
  }
};
