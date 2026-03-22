import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export const getCourseById = async (courseId: string) => {
  try {
    const res = await axiosInstance.get(
      `/api/v1/courses/get-course-by-id/${courseId}`,
    );

    return res.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Failed to get course";
    toast.error(message);
    throw error;
  }
};
