import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export const runCode = async (data: any) => {
  try {
    const result = await axiosInstance.post("/api/v1/code/run", data);
    return result.data;
  } catch (error) {
    toast.error("wrong code");
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
