import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export const getCourseProgressById = async (courseId: string) => {
  try {
    const res = await axiosInstance.get(
      `/api/v1/courses/get-individual-course-progress/${courseId}`,
    );

    return res.data;
  } catch (error) {
    toast.error("failed to get course progress");
  }
};
