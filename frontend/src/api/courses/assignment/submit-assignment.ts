import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export const submitAssignment = async (id: string, payload: any) => {
  try {
    const rawAnswers = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.answers)
        ? payload.answers
        : [];

    const answers = rawAnswers
      .map((item: any) => ({
        question_id: item?.question_id ?? item?.questionId,
        answer: Array.isArray(item?.answer) ? item.answer : [],
      }))
      .filter((item: { question_id?: string; answer: string[] }) => !!item.question_id);

    const body = { answers };

    const res = await axiosInstance.post(
      `/api/v1/courses/submit-course-assignment/${id}`,
      body,
    );

    return res.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Failed to submit assignment";
    toast.error(message);
    throw error;
  }
};
