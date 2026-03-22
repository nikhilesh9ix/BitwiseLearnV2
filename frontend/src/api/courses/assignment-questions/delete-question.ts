import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export const deleteAssignmentQuestion = async (questionId: string) => {
  try {
    if (!questionId) throw new Error("Question ID is required");

    const res = await axiosInstance.delete(
      `/api/v1/courses/remove-assignment-question/${questionId}`,
    );

    return res.data;
  } catch (error: any) {
    toast.error(error.message || "failed to delete question");
  }
};
