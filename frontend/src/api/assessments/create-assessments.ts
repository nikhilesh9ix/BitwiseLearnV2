import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";
type CreateAssessment = {
  name: string;
  description: string;
  instructions: string;
  startTime: string;
  endTime: string;
  individualSectionTimeLimit?: number;
  status?: "UPCOMING" | "LIVE" | "ENDED";
  autoSubmit: boolean;
  batchId: string;
};

export const createAssessments = async (payload: CreateAssessment) => {
  try {
    const requestBody = {
      name: payload.name,
      description: payload.description,
      instruction: payload.instructions,
      startTime: payload.startTime,
      endTime: payload.endTime,
      individualSectionTimeLimit: payload.individualSectionTimeLimit,
      status: payload.status,
      batchId: payload.batchId,
      autoSubmit: payload.autoSubmit,
    };

    const response = await axiosInstance.post(
      "/api/v1/assessments/create-assessment",
      requestBody,
    );

    return response.data.data;
  } catch (error: any) {
    toast.error(
      error?.response?.data?.error ||
        error?.response?.data?.message ||
        "error creating assessments",
    );
    throw error;
  }
};
