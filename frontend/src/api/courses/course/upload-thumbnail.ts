import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export const uploadThumbnail = async (
  courseId: string,
  file: File,
  stateFn?: any,
) => {
  try {
    const formData = new FormData();
    formData.append("thumbnail", file);

    const res = await axiosInstance.post(
      `/api/v1/courses/upload-thumbnail/${courseId}`,
      formData,
    );

    if (stateFn) {
      stateFn(res.data);
    }

    return res.data;
  } catch (error) {
    // toast.error("failed to upload course thumbnail");
  }
};
