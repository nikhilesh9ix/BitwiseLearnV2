import axiosInstance from "@/lib/axios";
import { resolveApiData, type StateSetter } from "@/lib/api";

export type AdminListItem = Record<string, unknown>;

export const getAllAdmins = async (
  stateFn?: StateSetter<AdminListItem[]>,
): Promise<AdminListItem[]> =>
  resolveApiData(axiosInstance.get("/api/v1/admins/get-all-admin"), {
    fallbackMessage: "Error fetching admins",
    fallbackValue: [],
    stateSetter: stateFn,
  });
