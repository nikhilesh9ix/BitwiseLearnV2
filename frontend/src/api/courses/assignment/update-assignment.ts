import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

type UpdateAssignmentPayload = {
  description?: string;
  marksPerQuestion?: number;
  instruction?: string;
};

export const updateAssignment = async (
  assignmentId: string,
  data: UpdateAssignmentPayload,
) => {
  try {
    const res = await axiosInstance.put(
      `/api/v1/courses/update-assignment-to-section/${assignmentId}`,
      {
        description: data.description,
        marks_per_question: data.marksPerQuestion,
        instruction: data.instruction,
      },
    );

    return res.data;
  } catch (error: any) {
    toast.error("failed to update assignment");
  }
};
