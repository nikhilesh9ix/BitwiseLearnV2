import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export const markAsDone = async (id: string) => {
  try {
    const res = await axiosInstance.post(
      `/api/v1/courses/mark-content-as-done/${id}`,
    );

    return res.data;
  } catch (error) {
    toast.error("failed to mark progress");
  }
};
export const markAsUnDone = async (id: string) => {
  try {
    const res = await axiosInstance.post(
      `/api/v1/courses/unmark-content-as-done/${id}`,
    );

    return res.data;
  } catch (error) {
    toast.error("failed to mark progress");
  }
};
