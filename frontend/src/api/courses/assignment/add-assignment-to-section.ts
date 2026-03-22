import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

type AddAssignmentPayload = {
  name: string;
  description: string;
  instruction: string;
  marksPerQuestion: number;
  sectionId: string;
};

export const addAssignmentToSection = async (
  payload: AddAssignmentPayload,
  stateFn?: any,
) => {
  try {
    const res = await axiosInstance.post(
      "/api/v1/courses/add-assignment-to-section/",
      {
        name: payload.name,
        description: payload.description,
        instruction: payload.instruction,
        marks_per_question: payload.marksPerQuestion,
        section_id: payload.sectionId,
      },
    );

    if (stateFn) {
      stateFn(res.data);
    }

    return res.data;
  } catch (error) {
    toast.error("failed to add section");
  }
};
