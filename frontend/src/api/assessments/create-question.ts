import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

type question = {
  question?: string;
  options?: string[];
  correctOption?: string;
  problemId?: string;
  maxMarks: number;
};

export const createQuestion = async (sectionId: string, payload: question) => {
  try {
    const reqBody = {
      question: payload.question || "",
      options: payload.options || [],
      correctOption: payload.correctOption || "",
      problemId: payload.problemId || "",
      maxMarks: payload.maxMarks,
    };

    const response = await axiosInstance.post(
      `/api/v1/assessments/add-assessment-question/${sectionId}`,
      reqBody,
    );

    return response.data.data;
  } catch (error: any) {
    toast.error(
      error?.response?.data?.error ||
        error?.response?.data?.message ||
        "error creating question",
    );
    throw error;
  }
};
