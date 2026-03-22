import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export type CreateStudentPayload = {
  name: string;
  rollNumber: string;
  email: string;
  loginPassword: string;
  batchId: string;
  institutionId?: string;
};

export const createStudent = async (payload: CreateStudentPayload) => {
  try {
    const response = await axiosInstance.post(
      "/api/v1/students/create-student",
      payload,
    );

    return response.data?.data;
  } catch (error) {
    toast.error("failed to create student");
    throw error;
  }
};
