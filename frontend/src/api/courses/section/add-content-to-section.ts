import axiosInstance from "@/lib/axios";

export const addContentToSection = async (
  sectionId: string,
  name: string,
  description: string,
) => {
  const res = await axiosInstance.post(
    `/api/v1/courses/add-content-to-section`,
    {
      name,
      description,
      section_id: sectionId,
    },
  );

  return res.data;
};
