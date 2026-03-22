import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";
// POST
export const deleteTestCase = async (id: string) => {
  try {
    const result = await axiosInstance.delete(
      "/api/v1/problems/delete-testcase-to-problem/" + id,
    );
    return result;
  } catch (error) {
    toast.error("failed to delete testcase");
  }
};
