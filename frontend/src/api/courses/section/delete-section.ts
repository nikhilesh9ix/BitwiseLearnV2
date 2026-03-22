import axiosInstance from "@/lib/axios";

export const deleteSectionById = async (sectionId: string) => {
  const res = await axiosInstance.delete(
    `/api/v1/courses/delete-course-section/${sectionId}`,
  );
  return res.data;
};
