import axiosInstance from "@/lib/axios";
import { resolveApiData, type StateSetter } from "@/lib/api";

export type BatchListItem = Record<string, unknown>;

export const getAllBatches = async (
  stateFn?: StateSetter<BatchListItem[]>,
  paramId?: string,
): Promise<BatchListItem[]> => {
  const endpoint = paramId
    ? `/api/v1/batches/get-all-batch/${paramId}`
    : "/api/v1/batches/get-all-batch";

  return resolveApiData(axiosInstance.get(endpoint), {
    fallbackMessage: "Failed to get batches",
    fallbackValue: [],
    stateSetter: stateFn,
  });
};
