import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export const runCode = async (data: any) => {
  try {
    const result = await axiosInstance.post("/api/v1/code/run", data);
    return result.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error?.response?.data?.detail ||
      error?.message ||
      "Code execution failed";

    return {
      testCases: [],
      compileOutput: message,
      error: message,
    };
  }
};
export const submitCode = async (data: any) => {
  try {
    const result = await axiosInstance.post("/api/v1/code/submit", data);
    return result.data;
  } catch (error) {
    toast.error("failed submission");
  }
};
