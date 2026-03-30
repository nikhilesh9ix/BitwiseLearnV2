import axiosInstance from "@/lib/axios";
import { resolveApiData, type StateSetter } from "@/lib/api";

export type AdminDashboardStats = Record<string, number>;

export const getAllStats = async (
  stateFn?: StateSetter<AdminDashboardStats>,
): Promise<AdminDashboardStats> =>
  resolveApiData(axiosInstance.get("/api/v1/reports/get-stats-count"), {
    fallbackMessage: "Error getting stats",
    fallbackValue: {},
    stateSetter: stateFn,
  });
