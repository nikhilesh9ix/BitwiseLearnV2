import axiosInstance from "@/lib/axios";

export const uploadTranscript = async (contentId: string, file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await axiosInstance.post(
    `/api/course/upload-transcript/${contentId}`,
    formData,
  );

  return res.data;
};
