import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";
type CreateVendor = {
  name: string;
  email: string;
  secondaryEmail?: string;
  tagline: string;
  phoneNumber: string;
  secondaryPhoneNumber?: string;
  websiteLink?: string;
};

export const createVendors = async (payload: CreateVendor) => {
  const requestBody = {
    name: payload.name,
    email: payload.email,
    secondaryEmail: payload.secondaryEmail,
    tagline: payload.tagline,
    phoneNumber: payload.phoneNumber,
    secondaryPhoneNumber: payload.secondaryPhoneNumber,
    websiteLink: payload.websiteLink,
  };
  try {
    const response = await axiosInstance.post(
      "/api/v1/vendors/create-vendor",
      requestBody,
    );

    return response.data.data;
  } catch (error: any) {
    toast.error(
      error?.response?.data?.error ||
        error?.response?.data?.message ||
        "failed to create vendor",
    );
    throw error;
  }
};
