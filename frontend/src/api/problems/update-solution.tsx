import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export async function updateSolution(id: string, data: any) {
  try {
    return await axiosInstance.patch(
      "/api/v1/problems/update-solution-to-problem/" + id,
      data,
    );
  } catch (error) {
    toast.error("failed to update problem solution");
    throw error;
  }
}
