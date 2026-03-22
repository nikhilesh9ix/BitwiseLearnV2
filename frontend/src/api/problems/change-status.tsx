import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export async function changeStatus(problemId: string) {
  try {
    const response = await axiosInstance.put(
      "/api/v1/problems/change-status/" + problemId,
    );
    return response.data;
  } catch (error) {
    toast.error("failed to get change status");
  }
}
export async function deleteStatus(problemId: string) {
  try {
    const response = await axiosInstance.delete(
      "/api/v1/problems/delete-problem/" + problemId,
    );
    return response.data;
  } catch (error) {
    toast.error("failed to get change status");
  }
}
