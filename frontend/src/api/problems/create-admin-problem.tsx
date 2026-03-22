import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export const createProblem = async (data: any) => {
  try {
    const res = await axiosInstance.post("/api/v1/problems/add-problem/", data);
    return res.data;
  } catch (error) {
    toast.error("failed to create problem");
    throw error;
  }
};
