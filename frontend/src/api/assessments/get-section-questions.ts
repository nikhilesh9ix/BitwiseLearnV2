import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export const getSectionQuestions = async (sectionId: string) => {
  try {
    const res = await axiosInstance.get(
      `/api/v1/assessments/get-questions-by-sectionId/${sectionId}`,
    );

    return res.data?.data || [];
  } catch (error: any) {
    toast.error("error getting section questions");
    return [];
  }
};
