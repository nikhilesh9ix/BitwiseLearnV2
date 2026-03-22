import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export const updateCourse = async (
  courseId: string,
  payload: {
    description?: string;
    duration?: string;
    instructorName?: string;
    level?: "BASIC" | "INTERMEDIATE" | "ADVANCE";
  },
) => {
  try {
    const res = await axiosInstance.put(
      `/api/v1/courses/update-course/${courseId}`,
      payload,
    );

    return res.data;
  } catch (error) {
    toast.error("failed to update course");
  }
};
