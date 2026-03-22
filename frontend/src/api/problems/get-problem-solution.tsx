import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export const getProblemSolutionById = async (statefn: any, id: string) => {
  try {
    const getProblem = await axiosInstance.get(
      "/api/v1/problems/admin/get-dsa-problem/solution/" + id,
    );
    statefn(getProblem.data);
  } catch (error) {
    toast.error("failed to get problem solution");
  }
};
