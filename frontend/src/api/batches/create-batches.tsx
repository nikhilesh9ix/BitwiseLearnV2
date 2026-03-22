import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export const uploadBatches = async (
  id: string,
  file: File,
  type: "STUDENT" | "BATCH" | "TESTCASE" | "CLOUD" | "ASSESSMENT" | "ASSIGNMENT",
  stateFn?: any,
) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    const res = await axiosInstance.post(`/api/upload/${id}`, formData);

    if (stateFn) {
      stateFn(res.data);
    }

    return res.data;
  } catch (error) {
    toast.error("failed to upload batch");
    throw error;
  }
};
