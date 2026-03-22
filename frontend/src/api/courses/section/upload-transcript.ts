import axiosInstance from "@/lib/axios";

export const uploadTranscript = async (contentId: string, file: File) => {
  const formData = new FormData();
  formData.append("content", file);

  const res = await axiosInstance.post(
    `/api/v1/courses/upload-file-in-content/${contentId}`,
    formData,
  );

  return res.data;
};
