import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export const publishCourse = async (courseId: string, stateFn?: any) => {
  try {
    const res = await axiosInstance.put(
      `/api/v1/courses/change-publish-status/${courseId}`,
    );

    if (stateFn) {
      stateFn(res.data);
    }

    return res.data;
  } catch (error) {
    toast.error("failed to publish course");
  }
};
