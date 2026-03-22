import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export const getProblemData = async (statefn: any, paramId: string) => {
  try {
    const getProblem = await axiosInstance.get(
      "/api/v1/problems/get-dsa-problem/" + paramId,
    );
    statefn(getProblem.data);
  } catch (error) {
    toast.error("failed to get problem");
  }
};
export const getAdminProblemData = async (statefn: any, paramId: string) => {
  try {
    const getProblem = await axiosInstance.get(
      "/api/v1/problems/admin/get-dsa-problem/" + paramId,
    );
    statefn(getProblem.data);
  } catch (error) {
    toast.error("failed to get problem data");
  }
};
