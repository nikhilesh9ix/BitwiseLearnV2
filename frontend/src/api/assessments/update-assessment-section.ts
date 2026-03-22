import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export interface UpdateAssessmentSection {
  name?: string;
  marksPerQuestion?: number;
}

export const updateAssessmentSection = async (
  sectionId: string,
  data: UpdateAssessmentSection,
) => {
  try {
    const res = await axiosInstance.put(
      `/api/v1/assessments/update-assessment-section/${sectionId}`,
      data,
    );
    return res.data.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Error updating section";
    toast.error(message);
    throw error;
  }
};
