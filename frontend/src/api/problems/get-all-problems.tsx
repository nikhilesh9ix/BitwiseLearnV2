import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export const getAllProblemData = async (
  statefn: any,
  admin: boolean = false,
) => {
  try {
    const endpoint = admin
      ? "/api/v1/problems/get-all-dsa-problem/"
      : "/api/v1/problems/get-all-listed-problem/";
    const getProblem = await axiosInstance.get(endpoint);
    statefn(getProblem.data?.data || []);
  } catch (error: any) {
    toast.error("failed to get problem");
    statefn([]);
    throw error;
  }
};
