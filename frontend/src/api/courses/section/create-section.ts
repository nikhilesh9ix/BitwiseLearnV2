import axiosInstance from "@/lib/axios";

export const createSection = async (courseId: string, name: string) => {
  const res = await axiosInstance.post(
    `/api/v1/courses/add-course-section/${courseId}`,
    {
      name,
    },
  );
  return res.data;
};
