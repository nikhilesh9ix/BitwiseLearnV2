import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export const uploadCertificate = async (
  courseId: string,
  file: File,
  stateFn?: any,
) => {
  try {
    const formData = new FormData();
    formData.append("certificate", file);

    const res = await axiosInstance.post(
      `/api/v1/courses/upload-completion-certificate/${courseId}`,
      formData,
    );

    if (stateFn) {
      stateFn(res.data);
    }

    return res.data;
  } catch (error) {
    toast.error("failed to update course certificate");
  }
};
