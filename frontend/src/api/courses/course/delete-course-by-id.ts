import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export const deleteCourseById = async (courseId: string) => {
  try {
    const res = await axiosInstance.delete(
      `/api/v1/courses/delete-course/${courseId}`,
    );
    return res.data;
  } catch (error) {
    toast.error("failed to delete course ");
  }
};
