import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export const getBatchData = async (statefn: any, paramId: string) => {
  try {
    const getBatch = await axiosInstance.get(
      "/api/v1/batches/get-batch-by-id/" + paramId,
    );
    statefn(getBatch.data?.data || null);
  } catch (error) {
    toast.error("failed to get batch");
  }
};
