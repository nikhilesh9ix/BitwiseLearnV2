import axiosInstance from "@/lib/axios";

export const deleteContentFromSection = async (contentId: string) => {
  const res = await axiosInstance.delete(
    `/api/v1/courses/delete-content/${contentId}`,
  );
  return res.data;
};
