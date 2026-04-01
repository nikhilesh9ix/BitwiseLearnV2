import axiosInstance from "@/lib/axios";

type UpdateContentPayload = {
  name?: string;
  description?: string;
  transcript?: string | null;
  videoUrl?: string;
};

export const updateContentToSection = async (
  contentId: string,
  data: UpdateContentPayload,
) => {
  const payload: any = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.description !== undefined) payload.description = data.description;
  if (data.videoUrl !== undefined) payload.videoUrl = data.videoUrl;
  if (data.transcript !== undefined) payload.transcript = data.transcript;

  try {
    const res = await axiosInstance.put(
      `/api/course/update-content-by-sectionId/${contentId}`,
      payload,
    );

    return res.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      "Failed to update topic";
    throw new Error(message);
  }
};
