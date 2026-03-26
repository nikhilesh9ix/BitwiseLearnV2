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
  if (data.name) payload.name = data.name;
  if (data.description) payload.description = data.description;
  if (data.videoUrl) payload.video_url = data.videoUrl;
  if (data.transcript) payload.transcript = data.transcript;

  const res = await axiosInstance.put(
    `/api/course/update-content-by-sectionId/${contentId}`,
    payload,
  );

  return res.data;
};
