import axiosInstance from "@/lib/axios";

export const getSections = async (courseId: string) => {
  const res = await axiosInstance.get(
    `/api/v1/courses/get-all-sections-by-course/${courseId}`,
  );

  return res.data;
};
