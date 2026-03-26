import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export const uploadThumbnail = async (
  courseId: string,
  file: File,
  stateFn?: any,
) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await axiosInstance.post(
      `/api/course/upload-thumbnail/${courseId}`,
      formData,
    );

    if (stateFn) {
      stateFn(res.data);
    }

    return res.data;
  } catch (error: any) {
    toast.error(error?.response?.data?.message || "failed to upload course thumbnail");
    throw error;
  }
};
