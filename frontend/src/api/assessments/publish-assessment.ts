import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export const updateAssessmentStatus = async (
  assessmentId: string,
  status: "LIVE" | "ENDED",
) => {
  try {
    const res = await axiosInstance.put(
      `/api/assessments/publish-assessment/${assessmentId}`,
      { status },
    );

    return res.data.data;
  } catch (error) {
    toast.error("error updating status");
    throw error;
  }
};
