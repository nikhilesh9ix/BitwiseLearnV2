import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export type createBatch = {
  batchname: string;
  branch: string;
  batchEndYear: string;
  institutionId: string;
};

export const createBatch = async (payload: createBatch) => {
  try {
    const response = await axiosInstance.post(
      "/api/v1/batches/create-batch",
      payload,
    );

    return response.data?.data;
  } catch (error) {
    toast.error("failed to create batch");
    throw error;
  }
};
