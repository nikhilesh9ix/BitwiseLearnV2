import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

type UpdateAssignmentQuestionPayload = {
  question?: string;
  options?: any[];
  correctAnswer?: string | string[];
  type?: "SCQ" | "MCQ";
};

export const updateAssignmentQuestion = async (
  questionId: string,
  payload: UpdateAssignmentQuestionPayload,
) => {
  try {
    if (!questionId) throw new Error("Question ID is required");

    const res = await axiosInstance.put(
      `/api/v1/courses/update-assignment-question/${questionId}`,
      {
        question: payload.question,
        options: payload.options,
        correct_answer: payload.correctAnswer,
        type: payload.type,
      },
    );

    return res.data;
  } catch (error: any) {
    toast.error(error.message || "failed to update question");
  }
};
