import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export const updateDescription = async (id: string, data: any) => {
  try {
    // console.log("problem id is " + id);
    await axiosInstance.patch("/api/v1/problems/update-problem/" + id, {
      name: data.name,
      description: data.description,
      hints: data.hints || [],
      difficulty: data.difficulty,
    });

    if (data.problemTopics.tagName.length > 0) {
      await axiosInstance.patch(
        "/api/v1/problems/update-topic-to-problem/" + data.problemTopics[0].id,
        {
          tagName: data.problemTopics[0].tagName,
        },
      );
    }
  } catch (error) {
    // toast.error("failed to updating description");
  }
};
