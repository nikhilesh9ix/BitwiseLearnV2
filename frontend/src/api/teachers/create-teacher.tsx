import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export type CreateTeacherPayload = {
  name: string;
  email: string;
  phoneNumber: string;
  instituteId: string;
  batchId: string;
  vendorId?: string | null;
};

export const createTeacher = async (
  data: CreateTeacherPayload,
  onSuccess?: () => void,
  onError?: (error: any) => void,
) => {
  try {
    const response = await axiosInstance.post(
      "/api/v1/teachers/create-teacher",
      data,
    );

    onSuccess?.();
    return response.data;
  } catch (error: any) {
    onError?.(error);

    toast.error("failed to create teacher");
    throw error;
  }
};
