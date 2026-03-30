import axiosInstance from "@/lib/axios";

export type CreateAdminPayload = Record<string, unknown>;

export const createAdmin = async (data: CreateAdminPayload) => {
  const response = await axiosInstance.post(
    "/api/v1/admins/create-admin",
    data,
  );
  return response.data;
};
