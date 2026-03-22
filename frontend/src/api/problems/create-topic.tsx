import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export const createTopic = async (id: string, data: any) => {
  try {
    await axiosInstance.post("/api/v1/problems/add-topic-to-problem/" + id, data);
  } catch (error) {
    toast.error("failed to create topic");
  }
};
