import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export const getAllBatches = async (stateFn: any, paramId?: string) => {
  try {
    const endpoint = paramId
      ? "/api/v1/batches/get-all-batch/" + paramId
      : "/api/v1/batches/get-all-batch";
    const response = await axiosInstance.get(endpoint);
    const batches = response.data?.data || [];
    stateFn(batches);
    return batches;
  } catch (error) {
    toast.error("failed to get batches");
    stateFn([]);
    return [];
  }
};
