import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export const updateProblemTestcase = async (id: string, data: any) => {
  try {
    const res = await axiosInstance.patch(
      "/api/v1/problems/update-testcase-to-problem/" + id,
      data,
    );
  } catch (error) {
    toast.error("failed to update testcase");
  }
};
