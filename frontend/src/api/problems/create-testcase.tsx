import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export const createTestCase = async (problemId: string, data: any) => {
  try {
    const response = await axiosInstance.post(
      "/api/v1/problems/add-testcase-to-problem/" + problemId,
      data,
    );

    return response.data;
  } catch (error) {
    toast.error("failed to create testcase");
  }
};
