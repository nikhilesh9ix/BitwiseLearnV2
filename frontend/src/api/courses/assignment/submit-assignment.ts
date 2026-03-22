import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export const submitAssignment = async (id: string, payload: any) => {
  try {
    await axiosInstance.post(`/api/v1/courses/submit-course-assignment/${id}`, payload);
  } catch (error: any) {
    toast.error(error.message);
  }
};
