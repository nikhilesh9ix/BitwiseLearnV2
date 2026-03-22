import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export const createProblemTemplate = async (problemId: string, data: any) => {
  try {
    const response = await axiosInstance.post(
      "/api/v1/problems/add-template-to-problem/" + problemId,
      data,
    );

    return response.data;
  } catch (error) {
    toast.error("failed to create template");
  }
};
