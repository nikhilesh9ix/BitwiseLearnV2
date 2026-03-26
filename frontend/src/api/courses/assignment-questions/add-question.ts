import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

type AddAssignmentQuestionPayload = {
  assignmentId: string;
  question: string;
  options: any[];
  correctAnswer: string[];
};

export const addAssignmentQuestion = async (
  assignmentId: string,
  payload: AddAssignmentQuestionPayload,
) => {
  try {
    const res = await axiosInstance.post(
      `/api/v1/courses/add-assignment-question/${assignmentId}`,
      {
        // assignmentId is in URL, ignore in body
        question: payload.question,
        options: payload.options,
        correct_answer: payload.correctAnswer,
        // type is missing in frontend payload type? Assuming it might be passed or optional in backend
      },
    );

    return res.data;
  } catch (error) {
    toast.error("failed to add question");
    throw error;
  }
};
