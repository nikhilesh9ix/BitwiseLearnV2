import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export const createCourse = async (
  payload: {
    name: string;
    description: string;
    level: string;
    duration: string;
    instructorName: string;
  },
  stateFn?: any,
) => {
  try {
    const res = await axiosInstance.post("/api/v1/courses/create-course", payload);

    if (stateFn) {
      stateFn(res.data?.data);
    }

    return res.data?.data;
  } catch (error: any) {
    toast.error(
      error?.response?.data?.error ||
        error?.response?.data?.message ||
        "failed to create course",
    );
    throw error;
  }
};
